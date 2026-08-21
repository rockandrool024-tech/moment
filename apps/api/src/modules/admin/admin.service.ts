import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Challenge, Dispute, Submission, User } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RoundStateMachineService } from "../rounds/round-state-machine.service";

export interface RetentionCohort {
  cohortSize: number;
  d1: number | null;
  d7: number | null;
  d30: number | null;
}

export interface GrowthDashboard {
  voteDeckCompletionRate: number;
  avgEntriesPerCampaign: number;
  brandRepeatRate: number;
  avgTimeToFirstPayoutHours: number | null;
  rallyKProxy: number;
  viralKFactor: number;
  retention: RetentionCohort;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: RoundStateMachineService,
  ) {}

  // ── God-view ──────────────────────────────────────────────────────────

  listChallenges(): Promise<Challenge[]> {
    return this.prisma.challenge.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  }

  async getChallengeDetail(challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        rounds: { orderBy: { roundNumber: "asc" } },
        submissions: { select: { id: true, creatorId: true, phase: true, status: true } },
        payouts: true,
      },
    });
    if (!challenge) throw new NotFoundException("Challenge not found");
    return challenge;
  }

  /** Rounds past their own scheduled deadline but not yet revealed — the
   * "stuck round" list a Redis outage right after a round-create commit can
   * produce (scheduleRoundJobs isn't transactional with the insert). */
  async listStuckRounds() {
    const now = new Date();
    return this.prisma.round.findMany({
      where: {
        status: { not: "revealed" },
        OR: [{ closesAt: { lt: now } }, { revealDeadlineAt: { lt: now } }],
      },
      include: { challenge: { select: { title: true } } },
      orderBy: { closesAt: "asc" },
    });
  }

  async forceRevealRound(roundId: string): Promise<void> {
    await this.stateMachine.forceRevealDeadline(roundId);
  }

  // ── Submissions ───────────────────────────────────────────────────────

  async eliminateSubmission(submissionId: string): Promise<Submission> {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.status === "eliminated") return submission;

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { status: "eliminated" },
    });
  }

  // ── KYB queue ─────────────────────────────────────────────────────────

  listKybQueue(): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { kybRequestedAt: { not: null }, kybVerified: false },
      orderBy: { kybRequestedAt: "asc" },
    });
  }

  approveKyb(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { kybVerified: true, kybRequestedAt: null },
    });
  }

  // Rejecting clears the request timestamp (back to "unverified, not
  // asking") rather than storing a rejection reason field the schema
  // doesn't have — the seller can simply request again once they've fixed
  // whatever the manual review flagged, same as before they ever asked.
  rejectKyb(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { kybVerified: false, kybRequestedAt: null },
    });
  }

  // ── Disputes ──────────────────────────────────────────────────────────
  // Raising a dispute lives on SubmissionsService (submissions.service.ts)
  // — that's the natural owner of "a creator acts on their own submission."
  // Admin only ever lists/resolves.

  listDisputes(status?: "open" | "upheld" | "denied"): Promise<Dispute[]> {
    return this.prisma.dispute.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: { submission: { select: { id: true, creatorId: true, status: true } } },
    });
  }

  async resolveDispute(
    disputeId: string,
    adminId: string,
    status: "upheld" | "denied",
    resolution: string,
  ): Promise<Dispute> {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) throw new NotFoundException("Dispute not found");
    if (dispute.status !== "open") throw new BadRequestException("This dispute is already resolved");

    // Upholding a dispute reverses the elimination — the submission goes
    // back to pending so it's re-considered wherever it left off; it does
    // NOT retroactively rerun a tally that already happened, since scores
    // from that round are already final for everyone else.
    if (status === "upheld") {
      await this.prisma.submission.update({
        where: { id: dispute.submissionId },
        data: { status: "pending" },
      });
    }

    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: { status, resolution, resolvedById: adminId, resolvedAt: new Date() },
    });
  }

  // ── Growth dashboard ──────────────────────────────────────────────────

  async getGrowthDashboard(): Promise<GrowthDashboard> {
    const [
      totalDecks,
      completedDecks,
      totalSubmissions,
      distinctChallengesWithSubmissions,
      sellerChallengeCounts,
      winnerPayouts,
      rallyAttributionCount,
      creatorsWithSubmissions,
      users,
      completedDeckEvents,
      submissionEvents,
      voteEvents,
      predictionEvents,
      referralTotal,
    ] = await Promise.all([
      this.prisma.deck.count(),
      this.prisma.deck.count({ where: { completedAt: { not: null } } }),
      this.prisma.submission.count(),
      this.prisma.submission.findMany({ distinct: ["challengeId"], select: { challengeId: true } }),
      this.prisma.challenge.groupBy({ by: ["sellerId"], _count: { _all: true } }),
      this.prisma.payout.findMany({
        where: { type: "winner" },
        select: { createdAt: true, challenge: { select: { resolvedAt: true } } },
      }),
      this.prisma.rallyAttribution.count(),
      this.prisma.submission.findMany({ distinct: ["creatorId"], select: { creatorId: true } }),
      this.prisma.user.findMany({ select: { id: true, createdAt: true } }),
      this.prisma.deck.findMany({ where: { completedAt: { not: null } }, select: { userId: true, completedAt: true } }),
      this.prisma.submission.findMany({ select: { creatorId: true, createdAt: true } }),
      this.prisma.vote.findMany({ select: { voterId: true, createdAt: true } }),
      this.prisma.prediction.findMany({ select: { userId: true, createdAt: true } }),
      this.prisma.referralReward.count(),
    ]);

    const repeatSellers = sellerChallengeCounts.filter((s) => s._count._all > 1).length;

    const activityByUser = new Map<string, Date[]>();
    const recordActivity = (userId: string, at: Date | null) => {
      if (!at) return;
      const existing = activityByUser.get(userId) ?? [];
      existing.push(at);
      activityByUser.set(userId, existing);
    };
    completedDeckEvents.forEach((event) => recordActivity(event.userId, event.completedAt));
    submissionEvents.forEach((event) => recordActivity(event.creatorId, event.createdAt));
    voteEvents.forEach((event) => recordActivity(event.voterId, event.createdAt));
    predictionEvents.forEach((event) => recordActivity(event.userId, event.createdAt));

    const dayMs = 24 * 60 * 60 * 1000;
    const retentionAt = (day: number): number | null => {
      const now = Date.now();
      const eligible = users.filter((user) => now - user.createdAt.getTime() >= day * dayMs);
      if (eligible.length === 0) return null;
      const retained = eligible.filter((user) =>
        (activityByUser.get(user.id) ?? []).some((activityAt) => {
          const offset = activityAt.getTime() - user.createdAt.getTime();
          return offset >= day * dayMs && offset < (day + 1) * dayMs;
        }),
      );
      return retained.length / eligible.length;
    };

    const timeToFirstPayoutSamples = winnerPayouts
      .filter((p) => p.challenge.resolvedAt)
      .map((p) => p.createdAt.getTime() - p.challenge.resolvedAt!.getTime());
    const avgTimeToFirstPayoutHours =
      timeToFirstPayoutSamples.length > 0
        ? timeToFirstPayoutSamples.reduce((a, b) => a + b, 0) /
          timeToFirstPayoutSamples.length /
          (1000 * 60 * 60)
        : null;

    return {
      voteDeckCompletionRate: totalDecks > 0 ? completedDecks / totalDecks : 0,
      avgEntriesPerCampaign:
        distinctChallengesWithSubmissions.length > 0
          ? totalSubmissions / distinctChallengesWithSubmissions.length
          : 0,
      brandRepeatRate: sellerChallengeCounts.length > 0 ? repeatSellers / sellerChallengeCounts.length : 0,
      avgTimeToFirstPayoutHours,
      // A proxy, not a literal viral k-factor (that needs signup-attribution
      // data over time) — recruited-voters per creator who has ever
      // recruited anyone, as a directional read on the rally loop's reach.
      rallyKProxy:
        creatorsWithSubmissions.length > 0 ? rallyAttributionCount / creatorsWithSubmissions.length : 0,
      // This is referred signups per registered user. It is a directional
      // product proxy, not a causal viral coefficient or a forecast.
      viralKFactor: users.length > 0 ? referralTotal / users.length : 0,
      retention: {
        cohortSize: users.length,
        d1: retentionAt(1),
        d7: retentionAt(7),
        d30: retentionAt(30),
      },
    };
  }
}
