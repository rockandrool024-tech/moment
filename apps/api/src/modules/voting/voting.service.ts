import { BadRequestException, Injectable } from "@nestjs/common";
import { RallyAttribution, Vote, VotePool } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class VotingService {
  constructor(private readonly prisma: PrismaService) {}

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

    try {
      return await this.prisma.vote.create({
        data: { roundId, voterId: userId, submissionId, pool },
      });
    } catch {
      throw new BadRequestException("You have already voted in this round");
    }
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
