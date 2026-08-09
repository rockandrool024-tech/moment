import { BadRequestException, Injectable } from "@nestjs/common";
import { RallyAttribution, Vote, VotePool } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StreakService } from "./streak.service";
import { ReferralsService } from "../referrals/referrals.service";

@Injectable()
export class VotingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly streakService: StreakService,
    private readonly referrals: ReferralsService,
  ) {}

  /**
   * Records the per-creator-scoped taint edge (ADR-005 §1) — called when a
   * spectator lands via a creator's rally link and verifies. Idempotent:
   * the edge never expires and is never duplicated or removed.
   */
  async recordRallyAttribution(
    voterId: string,
    creatorId: string,
    campaignId: string,
  ): Promise<RallyAttribution> {
    if (voterId === creatorId) {
      throw new BadRequestException("A creator cannot be attributed to their own rally link");
    }
    return this.prisma.rallyAttribution.upsert({
      where: { voterId_creatorId: { voterId, creatorId } },
      create: { voterId, creatorId, campaignId },
      update: {},
    });
  }

  async castVote(userId: string, roundId: string, submissionId: string): Promise<Vote> {
    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: roundId } });
    if (round.type !== "public_vote_final") {
      throw new BadRequestException("This round does not use public voting");
    }
    if (round.status !== "open") {
      throw new BadRequestException(`Round is ${round.status}; voting is closed`);
    }

    const submission = await this.prisma.submission.findUniqueOrThrow({
      where: { id: submissionId },
    });
    if (submission.challengeId !== round.challengeId || submission.status !== "advanced") {
      throw new BadRequestException("submissionId is not a finalist in this round");
    }

    const pool = await this.classifyPool(userId, submission.creatorId);

    let vote: Vote;
    try {
      // Rally votes earn the creator XP (growth-viral-mechanics.md §2) in the
      // same transaction as the vote — no XP is awarded if the vote itself
      // fails (e.g. already voted this round).
      [vote] = await this.prisma.$transaction([
        this.prisma.vote.create({ data: { roundId, voterId: userId, submissionId, pool } }),
        ...(pool === "rally"
          ? [
              this.prisma.user.update({
                where: { id: submission.creatorId },
                data: { rallyXp: { increment: 1 } },
              }),
            ]
          : []),
      ]);
    } catch {
      throw new BadRequestException("You have already voted in this round");
    }

    // Runs after the vote is durably committed, outside the try/catch, so a
    // streak/referral-reward failure never gets misreported as "already voted."
    await this.streakService.applyVoteForUser(userId);
    await this.referrals.rewardIfPending(userId, round.challengeId, "first_vote");
    return vote;
  }

  /** ADR-002/growth-viral-mechanics.md §2: resolves a creator's personal rally
   * link to whatever battle they currently have live. */
  async resolveRallyCode(code: string): Promise<{ creatorId: string; challengeId: string }> {
    const creator = await this.prisma.user.findUnique({ where: { referralCode: code } });
    if (!creator) throw new BadRequestException("Unknown rally code");

    const activeSubmission = await this.prisma.submission.findFirst({
      where: {
        creatorId: creator.id,
        status: { not: "eliminated" },
        challenge: { status: { in: ["round1_open", "round2_open", "round3_open"] } },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!activeSubmission) throw new BadRequestException("This creator has no active battle right now");

    return { creatorId: creator.id, challengeId: activeSubmission.challengeId };
  }

  /** "Your voters" counter (growth-viral-mechanics.md §2) — total people ever
   * recruited via this creator's rally link, plus their accrued rally XP. */
  async getRallyStats(userId: string): Promise<{ totalVoters: number; rallyXp: number }> {
    const [totalVoters, user] = await Promise.all([
      this.prisma.rallyAttribution.count({ where: { creatorId: userId } }),
      this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
    ]);
    return { totalVoters, rallyXp: user.rallyXp };
  }

  /**
   * ADR-005 §1: a voter attributed to `creatorId`'s rally link is
   * permanently excluded from the *quality* pool in ANY campaign where that
   * creator competes — not just the campaign the edge originated from.
   * `campaignId` on the edge is provenance only; the exclusion check is by
   * (voterId, creatorId) alone, which is why the edge is unique on that pair.
   */
  private async classifyPool(voterId: string, creatorId: string): Promise<VotePool> {
    const tainted = await this.prisma.rallyAttribution.findUnique({
      where: { voterId_creatorId: { voterId, creatorId } },
    });
    return tainted ? "rally" : "quality";
  }
}
