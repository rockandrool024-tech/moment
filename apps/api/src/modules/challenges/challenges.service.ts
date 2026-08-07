import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  Challenge,
  ChallengeStatus,
  PayoutType,
  RoundType,
  SubmissionPhase,
  SubmissionStatus,
} from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateChallengeDto } from "./dto/create-challenge.dto";
import { UsersService } from "../identity/users.service";
import { NotificationsService } from "../notifications/notifications.service";

export interface PhaseFunnelStats {
  phase: SubmissionPhase;
  submitted: number;
  advanced: number;
  eliminated: number;
  pending: number;
}

export interface RoundVoteStats {
  roundId: string;
  roundNumber: number;
  type: RoundType;
  votes: number;
}

export interface PayoutTypeStats {
  type: PayoutType;
  count: number;
  totalAmount: number;
}

export interface ChallengeAnalytics {
  challengeId: string;
  phases: PhaseFunnelStats[];
  rounds: RoundVoteStats[];
  payouts: PayoutTypeStats[];
}

const SUBMISSION_PHASES: SubmissionPhase[] = ["teaser", "full_content"];

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly notifications: NotificationsService,
  ) {}

  create(sellerId: string, dto: CreateChallengeDto): Promise<Challenge> {
    return this.prisma.challenge.create({
      data: {
        sellerId,
        title: dto.title,
        brief: dto.brief,
        checklistCriteria: dto.checklistCriteria as object,
        prizePool: dto.prizePool,
        stipendPool: dto.stipendPool ?? Math.round(dto.prizePool * 0.12),
        takeRateBps: dto.takeRateBps ?? 2000,
      },
    });
  }

  findMany(status?: ChallengeStatus): Promise<Challenge[]> {
    return this.prisma.challenge.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdOrThrow(id: string): Promise<Challenge> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException("Challenge not found");
    return challenge;
  }

  /**
   * Seller-facing funnel view, built entirely from existing tables (no new
   * schema): submission counts per phase/status, votes cast per round, and
   * payouts issued per type. Same ownership-check pattern as `fund`.
   */
  async getAnalytics(challengeId: string, userId: string): Promise<ChallengeAnalytics> {
    const challenge = await this.findByIdOrThrow(challengeId);
    if (challenge.sellerId !== userId) {
      throw new ForbiddenException("Only the owning seller can view analytics for this challenge");
    }

    const [submissionGroups, rounds, payoutGroups] = await Promise.all([
      this.prisma.submission.groupBy({
        by: ["phase", "status"],
        where: { challengeId },
        _count: { _all: true },
      }),
      this.prisma.round.findMany({
        where: { challengeId },
        orderBy: { roundNumber: "asc" },
        select: { id: true, roundNumber: true, type: true },
      }),
      this.prisma.payout.groupBy({
        by: ["type"],
        where: { challengeId },
        _count: { _all: true },
        _sum: { amount: true },
      }),
    ]);

    const phases: PhaseFunnelStats[] = SUBMISSION_PHASES.map((phase) => {
      const forPhase = submissionGroups.filter((g) => g.phase === phase);
      const countFor = (status: SubmissionStatus) =>
        forPhase.find((g) => g.status === status)?._count._all ?? 0;
      return {
        phase,
        submitted: forPhase.reduce((sum, g) => sum + g._count._all, 0),
        advanced: countFor("advanced"),
        eliminated: countFor("eliminated"),
        pending: countFor("pending"),
      };
    });

    const peerVoteRoundIds = rounds.filter((r) => r.type !== "public_vote_final").map((r) => r.id);
    const publicRoundIds = rounds.filter((r) => r.type === "public_vote_final").map((r) => r.id);

    const [peerVoteGroups, voteGroups] = await Promise.all([
      peerVoteRoundIds.length > 0
        ? this.prisma.peerVote.groupBy({
            by: ["roundId"],
            where: { roundId: { in: peerVoteRoundIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      publicRoundIds.length > 0
        ? this.prisma.vote.groupBy({
            by: ["roundId"],
            where: { roundId: { in: publicRoundIds } },
            _count: { _all: true },
          })
        : Promise.resolve([]),
    ]);

    const votesByRound = new Map<string, number>();
    for (const g of peerVoteGroups) votesByRound.set(g.roundId, g._count._all);
    for (const g of voteGroups) votesByRound.set(g.roundId, g._count._all);

    const roundStats: RoundVoteStats[] = rounds.map((r) => ({
      roundId: r.id,
      roundNumber: r.roundNumber,
      type: r.type,
      votes: votesByRound.get(r.id) ?? 0,
    }));

    const payouts: PayoutTypeStats[] = payoutGroups.map((g) => ({
      type: g.type,
      count: g._count._all,
      totalAmount: g._sum.amount ?? 0,
    }));

    return { challengeId, phases, rounds: roundStats, payouts };
  }

  async inviteCreator(challengeId: string, sellerId: string, creatorId: string): Promise<{ sent: true }> {
    const challenge = await this.findByIdOrThrow(challengeId);
    if (challenge.sellerId !== sellerId) {
      throw new ForbiddenException("Only the owning seller can invite creators to this challenge");
    }

    const creator = await this.users.findById(creatorId);
    if (!creator || (creator.role !== "creator" && creator.role !== "both")) {
      throw new BadRequestException("Target user is not a creator");
    }

    await this.notifications.enqueue({
      type: "challenge_invite",
      userId: creatorId,
      challengeId,
      invitedBy: sellerId,
    });

    return { sent: true };
  }
}
