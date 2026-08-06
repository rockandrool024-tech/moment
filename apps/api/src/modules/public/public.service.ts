import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PublicCacheService } from "./public-cache.service";

const CACHE_TTL_SECONDS = 5;

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
}
