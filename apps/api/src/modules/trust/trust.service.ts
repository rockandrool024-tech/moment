import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Rating } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

export interface CreatorTrustStats {
  wins: number;
  finalsRate: number;
  brandScore: number | null;
  brandScoreCount: number;
}

export interface BrandTrustStats {
  campaignsRun: number;
  totalPaidOutCents: number;
  onTimePayoutRate: number | null;
  creatorScore: number | null;
  creatorScoreCount: number;
  isColdStart: boolean;
  escrowedCents: number;
}

export interface TrustStats {
  creator: CreatorTrustStats | null;
  brand: BrandTrustStats | null;
}

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bidirectional rating, restricted to participants of a *resolved*
   * challenge (ADR-004) — prevents drive-by ratings from non-participants.
   */
  async createRating(raterId: string, dto: CreateRatingDto): Promise<Rating> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: dto.challengeId } });
    if (!challenge) throw new NotFoundException("Challenge not found");
    if (challenge.status !== "resolved") {
      throw new BadRequestException("Can only rate participants of a resolved challenge");
    }
    if (raterId === dto.rateeId) {
      throw new BadRequestException("Cannot rate yourself");
    }

    const raterIsSeller = challenge.sellerId === raterId;
    const rateeIsSeller = challenge.sellerId === dto.rateeId;

    let direction: "creator_to_brand" | "brand_to_creator";
    if (raterIsSeller && !rateeIsSeller) {
      const rateeParticipated = await this.prisma.submission.findFirst({
        where: { challengeId: dto.challengeId, creatorId: dto.rateeId },
      });
      if (!rateeParticipated) throw new ForbiddenException("ratee did not participate in this challenge");
      direction = "brand_to_creator";
    } else if (!raterIsSeller && rateeIsSeller) {
      const raterParticipated = await this.prisma.submission.findFirst({
        where: { challengeId: dto.challengeId, creatorId: raterId },
      });
      if (!raterParticipated) throw new ForbiddenException("You did not participate in this challenge");
      direction = "creator_to_brand";
    } else {
      throw new ForbiddenException("Rating must be between the seller and a participating creator");
    }

    try {
      return await this.prisma.rating.create({
        data: { challengeId: dto.challengeId, raterId, rateeId: dto.rateeId, direction, score: dto.score },
      });
    } catch {
      throw new BadRequestException("You've already rated this participant for this challenge");
    }
  }

  getRatingsGivenByUser(challengeId: string, raterId: string): Promise<Rating[]> {
    return this.prisma.rating.findMany({ where: { challengeId, raterId } });
  }

  async getTrustStats(userId: string): Promise<TrustStats> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const [creator, brand] = await Promise.all([
      user.role === "creator" || user.role === "both" ? this.computeCreatorStats(userId) : null,
      user.role === "seller" || user.role === "both" ? this.computeBrandStats(userId) : null,
    ]);

    return { creator, brand };
  }

  private async computeCreatorStats(userId: string): Promise<CreatorTrustStats> {
    const [wins, submissions, ratingAgg] = await Promise.all([
      this.prisma.payout.count({ where: { userId, type: "winner" } }),
      this.prisma.submission.findMany({
        where: { creatorId: userId },
        select: { challengeId: true, phase: true, status: true },
      }),
      this.prisma.rating.aggregate({
        where: { rateeId: userId, direction: "brand_to_creator" },
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

    const enteredChallengeIds = new Set(submissions.map((s) => s.challengeId));
    const finalsChallengeIds = new Set(
      submissions
        .filter((s) => s.phase === "full_content" && s.status === "advanced")
        .map((s) => s.challengeId),
    );

    return {
      wins,
      finalsRate: enteredChallengeIds.size > 0 ? finalsChallengeIds.size / enteredChallengeIds.size : 0,
      brandScore: ratingAgg._avg.score,
      brandScoreCount: ratingAgg._count.score,
    };
  }

  private async computeBrandStats(userId: string): Promise<BrandTrustStats> {
    const [resolvedChallenges, activeChallenges, ratingAgg] = await Promise.all([
      this.prisma.challenge.findMany({
        where: { sellerId: userId, status: "resolved" },
        select: { id: true },
      }),
      this.prisma.challenge.findMany({
        where: { sellerId: userId, status: { in: ["funded", "round1_open", "round2_open", "round3_open"] } },
        select: { prizePool: true, stipendPool: true },
      }),
      this.prisma.rating.aggregate({
        where: { rateeId: userId, direction: "creator_to_brand" },
        _avg: { score: true },
        _count: { score: true },
      }),
    ]);

    const resolvedIds = resolvedChallenges.map((c) => c.id);
    const payouts =
      resolvedIds.length > 0
        ? await this.prisma.payout.findMany({ where: { challengeId: { in: resolvedIds } } })
        : [];

    const totalPaidOutCents = payouts.reduce((sum, p) => sum + p.amount, 0);
    // payoutDueAt is already the SLA deadline (final-round-reveal + 7 days,
    // set in payouts.service.ts) — computed from payment-provider timestamps
    // only, never app-side state, per ADR-004's own requirement.
    const decided = payouts.filter((p) => p.paidAt && p.payoutDueAt);
    const onTime = decided.filter((p) => p.paidAt! <= p.payoutDueAt!);

    const escrowedCents = activeChallenges.reduce((sum, c) => sum + c.prizePool + c.stipendPool, 0);

    return {
      campaignsRun: resolvedChallenges.length,
      totalPaidOutCents,
      onTimePayoutRate: decided.length > 0 ? onTime.length / decided.length : null,
      creatorScore: ratingAgg._avg.score,
      creatorScoreCount: ratingAgg._count.score,
      // ADR-004 cold-start trade-off: a brand with zero history never
      // renders as a row of zeroes — escrow-funded proof substitutes for
      // track record until track record exists.
      isColdStart: resolvedChallenges.length === 0,
      escrowedCents,
    };
  }
}
