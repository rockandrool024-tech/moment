import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PublicCacheService } from "./public-cache.service";

const CACHE_TTL_SECONDS = 5;
const DISCOVERY_CACHE_TTL_SECONDS = 30; // less time-sensitive than a live tally
const DISCOVERY_LIMIT = 20;

export interface PublicChallengeSummary {
  id: string;
  title: string;
  brief: string;
  prizePool: number;
  stipendPool: number;
  status: string;
  currentRound: {
    id: string;
    roundNumber: number;
    type: string;
    status: string;
    closesAt: string;
  } | null;
}

export interface PublicTally {
  roundId: string;
  visible: boolean;
  tallies: { submissionId: string; votes: number }[];
}

export interface DiscoveryCreator {
  id: string;
  displayName: string | null;
  tier: number;
  wins: number;
  referralCode: string;
}

export interface DiscoveryBrand {
  id: string;
  displayName: string | null;
  activeChallengeCount: number;
  activePrizePoolCents: number;
  isColdStart: boolean;
}

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: PublicCacheService,
  ) {}

  async getChallengeSummary(challengeId: string): Promise<PublicChallengeSummary> {
    return this.cache.getOrSet(`public:challenge:${challengeId}`, CACHE_TTL_SECONDS, async () => {
      const challenge = await this.prisma.challenge.findUnique({
        where: { id: challengeId },
        include: { rounds: { orderBy: { roundNumber: "desc" }, take: 1 } },
      });
      if (!challenge) throw new NotFoundException("Challenge not found");

      const round = challenge.rounds[0];
      return {
        id: challenge.id,
        title: challenge.title,
        brief: challenge.brief,
        prizePool: challenge.prizePool,
        stipendPool: challenge.stipendPool,
        status: challenge.status,
        currentRound: round
          ? {
              id: round.id,
              roundNumber: round.roundNumber,
              type: round.type,
              status: round.status,
              closesAt: round.closesAt.toISOString(),
            }
          : null,
      };
    });
  }

  async getCurrentTally(challengeId: string): Promise<PublicTally> {
    return this.cache.getOrSet(`public:challenge:${challengeId}:tally`, CACHE_TTL_SECONDS, async () => {
      const round = await this.prisma.round.findFirst({
        where: { challengeId },
        orderBy: { roundNumber: "desc" },
      });
      if (!round) throw new NotFoundException("No rounds open for this challenge yet");

      // Peer-vote rounds stay blind until reveal (ADR-003's anti-sabotage
      // design + ADR-004's peer-vote-leakage guardrail) — only the public
      // final round exposes a live, spectator-facing tally.
      if (round.type !== "public_vote_final") {
        return { roundId: round.id, visible: false, tallies: [] };
      }

      const grouped = await this.prisma.vote.groupBy({
        by: ["submissionId"],
        where: { roundId: round.id, pool: "quality" },
        _count: { _all: true },
      });

      return {
        roundId: round.id,
        visible: true,
        tallies: grouped.map((g) => ({ submissionId: g.submissionId, votes: g._count._all })),
      };
    });
  }

  /**
   * Discovery feed (Sprint 2) — ranks by tier then lifetime earnings, the
   * same signal already shown as a badge everywhere a creator appears.
   * Public/no-auth, cached, since it's meant to be a browsable "who's
   * winning right now" surface for spectators, not just logged-in users.
   */
  async getDiscoveryCreators(): Promise<DiscoveryCreator[]> {
    return this.cache.getOrSet("public:discovery:creators", DISCOVERY_CACHE_TTL_SECONDS, async () => {
      const creators = await this.prisma.user.findMany({
        where: { role: { in: ["creator", "both"] }, phoneVerifiedAt: { not: null } },
        orderBy: [{ tier: "desc" }, { lifetimeEarnings: "desc" }],
        take: DISCOVERY_LIMIT,
        select: { id: true, displayName: true, tier: true, referralCode: true },
      });
      if (creators.length === 0) return [];

      const winCounts = await this.prisma.payout.groupBy({
        by: ["userId"],
        where: { userId: { in: creators.map((c) => c.id) }, type: "winner" },
        _count: { _all: true },
      });
      const winsByUser = new Map(winCounts.map((w) => [w.userId, w._count._all]));

      return creators.map((c) => ({
        id: c.id,
        displayName: c.displayName,
        tier: c.tier,
        referralCode: c.referralCode,
        wins: winsByUser.get(c.id) ?? 0,
      }));
    });
  }

  async getDiscoveryBrands(): Promise<DiscoveryBrand[]> {
    return this.cache.getOrSet("public:discovery:brands", DISCOVERY_CACHE_TTL_SECONDS, async () => {
      const activeChallenges = await this.prisma.challenge.findMany({
        where: { status: { in: ["round1_open", "round2_open", "round3_open"] } },
        select: { sellerId: true, prizePool: true, stipendPool: true },
      });
      if (activeChallenges.length === 0) return [];

      const bySeller = new Map<string, { count: number; poolCents: number }>();
      for (const c of activeChallenges) {
        const entry = bySeller.get(c.sellerId) ?? { count: 0, poolCents: 0 };
        entry.count += 1;
        entry.poolCents += c.prizePool + c.stipendPool;
        bySeller.set(c.sellerId, entry);
      }

      const sellers = await this.prisma.user.findMany({
        where: { id: { in: [...bySeller.keys()] } },
        select: { id: true, displayName: true },
      });

      const resolvedCounts = await this.prisma.challenge.groupBy({
        by: ["sellerId"],
        where: { sellerId: { in: [...bySeller.keys()] }, status: "resolved" },
        _count: { _all: true },
      });
      const resolvedBySeller = new Map(resolvedCounts.map((r) => [r.sellerId, r._count._all]));

      return sellers
        .map((s) => {
          const stats = bySeller.get(s.id)!;
          return {
            id: s.id,
            displayName: s.displayName,
            activeChallengeCount: stats.count,
            activePrizePoolCents: stats.poolCents,
            isColdStart: (resolvedBySeller.get(s.id) ?? 0) === 0,
          };
        })
        .sort((a, b) => b.activePrizePoolCents - a.activePrizePoolCents)
        .slice(0, DISCOVERY_LIMIT);
    });
  }
}
