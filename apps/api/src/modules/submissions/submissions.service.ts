import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Dispute, Submission, SubmissionPhase } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { ChecklistCriteria, evaluateChecklist } from "./checklist";
import { ReferralsService } from "../referrals/referrals.service";

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly referrals: ReferralsService,
  ) {}

  async create(creatorId: string, dto: CreateSubmissionDto): Promise<Submission> {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: dto.challengeId },
    });
    if (!challenge) throw new NotFoundException("Challenge not found");

    const expectedStatus = dto.phase === "teaser" ? "round1_open" : "round2_open";
    if (challenge.status !== expectedStatus) {
      throw new BadRequestException(
        `Challenge is not accepting ${dto.phase} submissions (status: ${challenge.status})`,
      );
    }

    // A checklist violation auto-eliminates rather than rejecting the
    // request — the attempt is still recorded so a creator can appeal it
    // via the (future) dispute flow, per production-app-scope.md.
    const { passed } = evaluateChecklist(challenge.checklistCriteria as ChecklistCriteria, {
      durationSeconds: dto.durationSeconds,
      caption: dto.caption,
    });

    const submission = await this.prisma.submission.create({
      data: {
        creatorId,
        challengeId: dto.challengeId,
        phase: dto.phase as SubmissionPhase,
        status: passed ? "pending" : "eliminated",
      },
    });

    // Referral loop 3 — a submission counts as "doing something," even an
    // auto-eliminated one; showing up and trying is the action being
    // rewarded, not making it past the checklist.
    await this.referrals.rewardIfPending(creatorId, dto.challengeId, "first_submission");

    return submission;
  }

  async scoreBySeller(submissionId: string, sellerId: string, score: number): Promise<Submission> {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: { challenge: true },
    });
    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.challenge.sellerId !== sellerId) {
      throw new ForbiddenException("Only the owning seller can score this submission");
    }

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: { sellerScore: score },
    });
  }

  findMany(filters: {
    challengeId?: string;
    phase?: SubmissionPhase;
    creatorId?: string;
  }): Promise<Submission[]> {
    return this.prisma.submission.findMany({
      where: filters,
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Public (no auth) — powers both the /results/[submissionId] share-card
   * page and its opengraph-image, which need to render for an unauthenticated
   * visitor who clicked a shared link. `isWinner` is derived from the
   * Payout ledger, never from Submission.status alone, since "advanced" in
   * the final round doesn't by itself distinguish the winner from the other
   * finalists (see round-state-machine.service.ts's tallyPublicFinal).
   */
  async findByIdWithOutcome(submissionId: string): Promise<
    Submission & {
      isWinner: boolean;
      challenge: { title: string; prizePool: number };
      creatorReferralCode: string;
      creatorTier: number;
    }
  > {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        challenge: { select: { title: true, prizePool: true } },
        creator: { select: { referralCode: true, tier: true } },
      },
    });
    if (!submission) throw new NotFoundException("Submission not found");

    const winnerPayout = await this.prisma.payout.findFirst({
      where: { challengeId: submission.challengeId, userId: submission.creatorId, type: "winner" },
    });

    const { creator, ...rest } = submission;
    return {
      ...rest,
      isWinner: !!winnerPayout,
      creatorReferralCode: creator.referralCode,
      creatorTier: creator.tier,
    };
  }

  /** A creator appealing their own elimination — admin.service.ts owns
   * listing/resolving, this owns the one thing only the creator can do. */
  async raiseDispute(submissionId: string, creatorId: string, reason: string): Promise<Dispute> {
    const submission = await this.prisma.submission.findUnique({ where: { id: submissionId } });
    if (!submission) throw new NotFoundException("Submission not found");
    if (submission.creatorId !== creatorId) {
      throw new ForbiddenException("You can only dispute your own submission");
    }
    if (submission.status !== "eliminated") {
      throw new BadRequestException("Only an eliminated submission can be disputed");
    }

    const openExisting = await this.prisma.dispute.findFirst({
      where: { submissionId, status: "open" },
    });
    if (openExisting) throw new BadRequestException("This submission already has an open dispute");

    return this.prisma.dispute.create({
      data: { submissionId, challengeId: submission.challengeId, raisedById: creatorId, reason },
    });
  }
}
