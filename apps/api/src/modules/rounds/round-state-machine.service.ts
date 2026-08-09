import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { Round } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PayoutEntry, PayoutsService } from "../payments/payouts.service";
import { computeFundingBreakdown } from "../payments/pricing";
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

    // Atomic claim, not a plain status write: onPeerVoteCast fires on every
    // vote and can race closeRound/forceRevealDeadline, so more than one
    // caller can observe status === "closed" concurrently. Whoever's
    // conditional UPDATE actually matches a row is the one that runs the
    // tally + payout logic below; everyone else backs off. Without this,
    // the same round can be tallied (and its payouts sent) more than once.
    const claim = await this.prisma.round.updateMany({
      where: { id: roundId, status: "closed" },
      data: { status: "tallied" },
    });
    if (claim.count === 0) return; // another caller already claimed this round

    if (round.type === "public_vote_final") {
      await this.tallyPublicFinal(round);
    } else {
      await this.tallyPeerVoteRound(round, forced);
    }

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

    // Round-2 survivors (ADR-005 §3): eliminated *here*, in peer_vote_narrow,
    // means they made it through round 1 (earned the right to shoot full
    // content) but didn't reach the round-3 final — the specific group the
    // survivor bonus exists to retain. Round-1 eliminations get nothing here,
    // matching README's "13 of 32 paid" math (round-1 cuts aren't survivors).
    if (round.type === "peer_vote_narrow" && eliminatedSubmissionIds.length > 0) {
      const challenge = await this.prisma.challenge.findUniqueOrThrow({
        where: { id: round.challengeId },
      });
      const breakdown = computeFundingBreakdown(
        challenge.prizePool,
        challenge.takeRateBps,
        challenge.stipendPool,
      );
      const bonusEach = Math.floor(breakdown.survivorBonusPool / eliminatedSubmissionIds.length);

      if (bonusEach > 0) {
        const eliminated = await this.prisma.submission.findMany({
          where: { id: { in: eliminatedSubmissionIds } },
        });
        await this.payouts.batchCreateAndTransfer(
          round.challengeId,
          eliminated.map((s) => ({
            userId: s.creatorId,
            type: "survivor_bonus" as const,
            amount: bonusEach,
          })),
          new Date(),
        );
      }
    }
  }

  private async tallyPublicFinal(round: Round): Promise<void> {
    // All round-3 entrants are already "finalists" — round 2's own tally
    // (tallyPeerVoteRound, shared across rounds 1 and 2) already flipped
    // their status to "advanced" when they cleared peer_vote_narrow; round
    // 3 never creates a new submission row, so that's the status to look
    // for here, not "pending" (which would only ever match a full_content
    // submission that hasn't been through round 2's tally at all).
    const finalists = await this.prisma.submission.findMany({
      where: { challengeId: round.challengeId, phase: "full_content", status: "advanced" },
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
    // Seller final pick (Sprint 3) overrides the vote-ranked winner if one
    // was set via PATCH /rounds/:id/final-pick — falls back to the top
    // quality-vote finalist otherwise, exactly as before this existed.
    const finalPick = round.finalPickSubmissionId
      ? finalists.find((f) => f.id === round.finalPickSubmissionId)
      : undefined;
    const winner = finalPick ?? ranked[0];

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
      const breakdown = computeFundingBreakdown(
        challenge.prizePool,
        challenge.takeRateBps,
        challenge.stipendPool,
      );

      // Every finalist gets a stipend; the winner additionally gets the
      // pool (README economics table — the winner is one of the four
      // stipend recipients, not paid outside that group).
      const entries: PayoutEntry[] = finalists.flatMap((f) => {
        const stipend = { userId: f.creatorId, type: "stipend" as const, amount: stipendEach };
        return f.id === winner.id
          ? [stipend, { userId: f.creatorId, type: "winner" as const, amount: challenge.prizePool }]
          : [stipend];
      });

      // Crowd favourite (ADR-005 §1/§3): the non-winning finalist with the
      // most rally-pool votes — platform-funded, never the prize. Two
      // winners per campaign, two share moments.
      const rallyTallies = await this.prisma.vote.groupBy({
        by: ["submissionId"],
        where: { roundId: round.id, pool: "rally" },
        _count: { _all: true },
      });
      const rallyVotesBySubmission = new Map(rallyTallies.map((t) => [t.submissionId, t._count._all]));
      const crowdFavourite = finalists
        .filter((f) => f.id !== winner.id)
        .filter((f) => (rallyVotesBySubmission.get(f.id) ?? 0) > 0)
        .sort((a, b) => (rallyVotesBySubmission.get(b.id) ?? 0) - (rallyVotesBySubmission.get(a.id) ?? 0))[0];

      if (crowdFavourite) {
        entries.push({
          userId: crowdFavourite.creatorId,
          type: "crowd_favourite",
          amount: breakdown.crowdFavourite,
        });
      }

      await this.payouts.batchCreateAndTransfer(round.challengeId, entries, new Date());
    }

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
