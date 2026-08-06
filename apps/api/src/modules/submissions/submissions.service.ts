import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Submission, SubmissionPhase } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { ChecklistCriteria, evaluateChecklist } from "./checklist";

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

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

    return this.prisma.submission.create({
      data: {
        creatorId,
        challengeId: dto.challengeId,
        phase: dto.phase as SubmissionPhase,
        status: passed ? "pending" : "eliminated",
      },
    });
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
}
