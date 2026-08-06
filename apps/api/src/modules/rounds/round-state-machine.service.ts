import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { Round } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PayoutsService } from "../payments/payouts.service";
import { NotificationsService } from "../notifications/notifications.service";
import {
  applyParticipationPenalty,
  computeComposite,
  isParticipationGateSatisfied,
  rankAndSelectAdvancers,
} from "./scoring";

export interface RoundJobPayload {
  roundId: string;
}

// The crux (ADR-001): drives open -> closed -> tallied -> revealed entirely
// through queued jobs, never request-time logic. See the class-level docs
// in scoring.ts for the composite/gate math this delegates to.
@Injectable()
export class RoundStateMachineService {
  private readonly logger = new Logger(RoundStateMachineService.name);

  constructor(
    @InjectQueue("rounds") private readonly queue: Queue<RoundJobPayload>,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly payouts: PayoutsService,
    private readonly notifications: NotificationsService,
  ) {}

  async scheduleRoundJobs(round: Round): Promise<void> {
    const now = Date.now();
    await this.queue.add(
      "close-round",
      { roundId: round.id },
      { delay: Math.max(0, round.closesAt.getTime() - now), jobId: `close-${round.id}` },
    );
    if (round.revealDeadlineAt) {
      await this.queue.add(
        "reveal-deadline",
        { roundId: round.id },
        {
          delay: Math.max(0, round.revealDeadlineAt.getTime() - now),
          jobId: `reveal-deadline-${round.id}`,
        },
      );
    }
  }

  /** Fired by the 'close-round' job at Round.closesAt. */
  async closeRound(roundId: string): Promise<void> {
    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: roundId } });
    if (round.status !== "open") return; // idempotent

    const closed = await this.prisma.round.update({
      where: { id: roundId },
      data: { status: "closed" },
    });

    if (closed.type === "public_vote_final") {
      // No participation gate on the audience — tally immediately.
      await this.tallyAndReveal(roundId);
      return;
    }

    if (await this.isGateSatisfied(closed)) {
      await this.tallyAndReveal(roundId);
    }
    // Otherwise wait for onPeerVoteCast() to recheck, or the reveal-deadline
    // job to force it — this is the "waiting on stragglers" window (ADR-003).
  }

  /** Called by the voting module after every PeerVote insert. */
  async onPeerVoteCast(roundId: string): Promise<void> {
    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: roundId } });
    if (round.status !== "closed") return;
    if (await this.isGateSatisfied(round)) {
      await this.tallyAndReveal(roundId);
    }
  }

  /** Fired by the 'reveal-deadline' job. Forces reveal regardless of stragglers. */
  async forceRevealDeadline(roundId: string): Promise<void> {
    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: roundId } });
    if (round.status === "revealed") return; // idempotent
    if (round.status === "open") {
      await this.prisma.round.update({ where: { id: roundId }, data: { status: "closed" } });
    }
    if (round.status !== "tallied") {
      await this.tallyAndReveal(roundId, true);
    } else {
      await this.reveal(roundId);
    }
  }

  private async isGateSatisfied(round: Round): Promise<boolean> {
    if (round.type === "public_vote_final") return true;

    const phase = round.type === "peer_vote_teaser" ? "teaser" : "full_content";
    const active = await this.prisma.submission.findMany({
      where: { challengeId: round.challengeId, phase, status: "pending" },
      select: { creatorId: true },
    });
    const activeVoterIds = active.map((s) => s.creatorId);
    if (activeVoterIds.length === 0) return true;

    const counts = await this.prisma.peerVote.groupBy({
      by: ["voterUserId"],
      where: { roundId: round.id },
      _count: { _all: true },
    });
    const votesCastByVoter = new Map(counts.map((c) => [c.voterUserId, c._count._all]));

    const gateThreshold = this.config.get<number>("rounds.participationGateVotes")!;
    return isParticipationGateSatisfied(votesCastByVoter, activeVoterIds, gateThreshold);
  }

  private async tallyAndReveal(roundId: string, forced = false): Promise<void> {
    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: roundId } });
    if (round.status === "revealed" || round.status === "tallied") return; // idempotent

    if (round.type === "public_vote_final") {
      await this.tallyPublicFinal(round);
    } else {
      await this.tallyPeerVoteRound(round, forced);
    }

    await this.prisma.round.update({ where: { id: roundId }, data: { status: "tallied" } });
    await this.reveal(roundId);
  }

  private async tallyPeerVoteRound(round: Round, forced: boolean): Promise<void> {
    const phase = round.type === "peer_vote_teaser" ? "teaser" : "full_content";
    const active = await this.prisma.submission.findMany({
      where: { challengeId: round.challengeId, phase, status: "pending" },
    });

    const wins = await this.prisma.peerVote.groupBy({
      by: ["submissionId"],
      where: { roundId: round.id },
      _count: { _all: true },
    });
    const losses = await this.prisma.peerVote.groupBy({
      by: ["loserSubmissionId"],
      where: { roundId: round.id },
      _count: { _all: true },
    });
    const winsBySubmission = new Map(wins.map((w) => [w.submissionId, w._count._all]));
    const lossesBySubmission = new Map(losses.map((l) => [l.loserSubmissionId, l._count._all]));

    const voteCounts = await this.prisma.peerVote.groupBy({
      by: ["voterUserId"],
      where: { roundId: round.id },
      _count: { _all: true },
    });
    const votesCastByVoter = new Map(voteCounts.map((c) => [c.voterUserId, c._count._all]));

    const gateThreshold = this.config.get<number>("rounds.participationGateVotes")!;
    const penaltyMultiplier = this.config.get<number>("rounds.nonParticipationPenalty")!;
    const weights = {
      peerVoteWeight: this.config.get<number>("rounds.peerVoteWeight")!,
      sellerScoreWeight: this.config.get<number>("rounds.sellerScoreWeight")!,
    };

    const scored = active.map((submission) => {
      const submissionWins = winsBySubmission.get(submission.id) ?? 0;
      const submissionLosses = lossesBySubmission.get(submission.id) ?? 0;
      const rawComposite = computeComposite(
        submissionWins,
        submissionWins + submissionLosses,
        submission.sellerScore,
        weights,
      );
      const votesCast = votesCastByVoter.get(submission.creatorId) ?? 0;
      const composite = applyParticipationPenalty(
        rawComposite,
        votesCast,
        gateThreshold,
        penaltyMultiplier,
      );
      return { submissionId: submission.id, composite };
    });

    const { advancedSubmissionIds, eliminatedSubmissionIds } = rankAndSelectAdvancers(
      scored,
      round.advanceCount,
    );

    await this.prisma.$transaction([
      ...scored.map((s) =>
        this.prisma.submission.update({
          where: { id: s.submissionId },
          data: { compositeScore: s.composite },
        }),
      ),
      this.prisma.submission.updateMany({
        where: { id: { in: advancedSubmissionIds } },
        data: { status: "advanced" },
      }),
      this.prisma.submission.updateMany({
        where: { id: { in: eliminatedSubmissionIds } },
        data: { status: "eliminated" },
      }),
    ]);

    if (forced) {
      this.logger.log(
        `Round ${round.id} force-tallied at reveal deadline — some creators were under the ${gateThreshold}-vote gate`,
      );
    }
  }

  private async tallyPublicFinal(round: Round): Promise<void> {
    // All round-3 entrants are already "finalists" — round 2 did the
    // narrowing. This tally only ranks them to find the winner; nobody
    // gets eliminated further.
    const finalists = await this.prisma.submission.findMany({
      where: { challengeId: round.challengeId, phase: "full_content", status: "pending" },
    });

    const qualityTallies = await this.prisma.vote.groupBy({
      by: ["submissionId"],
      where: { roundId: round.id, pool: "quality" },
      _count: { _all: true },
    });
    const qualityVotesBySubmission = new Map(
      qualityTallies.map((t) => [t.submissionId, t._count._all]),
    );

    const ranked = [...finalists].sort((a, b) => {
      const diff =
        (qualityVotesBySubmission.get(b.id) ?? 0) - (qualityVotesBySubmission.get(a.id) ?? 0);
      return diff !== 0 ? diff : a.id.localeCompare(b.id);
    });
    const winner = ranked[0];

    const challenge = await this.prisma.challenge.findUniqueOrThrow({
      where: { id: round.challengeId },
    });

    if (finalists.length > 0) {
      await this.prisma.submission.updateMany({
        where: { id: { in: finalists.map((f) => f.id) } },
        data: { status: "advanced" },
      });
    }

    if (winner) {
      const stipendEach = Math.floor(challenge.stipendPool / finalists.length);

      // Every finalist gets a stipend; the winner additionally gets the
      // pool (README economics table — the winner is one of the four
      // stipend recipients, not paid outside that group).
      const entries = finalists.flatMap((f) => {
        const stipend = { userId: f.creatorId, type: "stipend" as const, amount: stipendEach };
        return f.id === winner.id
          ? [stipend, { userId: f.creatorId, type: "winner" as const, amount: challenge.prizePool }]
          : [stipend];
      });

      await this.payouts.batchCreateAndTransfer(round.challengeId, entries, new Date());
    }

    // Crowd favourite and round-2 survivor bonus (ADR-005) are Phase 3
    // scope — the Payout.type values exist in the schema but aren't
    // triggered from this tally yet; see production-app-scope.md.

    await this.prisma.challenge.update({
      where: { id: round.challengeId },
      data: { status: "resolved", resolvedAt: new Date() },
    });
  }

  private async reveal(roundId: string): Promise<void> {
    const round = await this.prisma.round.update({
      where: { id: roundId },
      data: { status: "revealed", revealedAt: new Date() },
      include: { challenge: { include: { submissions: { select: { creatorId: true } } } } },
    });

    const creatorIds = new Set(round.challenge.submissions.map((s) => s.creatorId));
    for (const userId of creatorIds) {
      await this.notifications.enqueue({ type: "round_revealed", userId, roundId });
    }
  }
}
