import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, RoundStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

@Injectable()
export class PredictionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getRoundPredictions(roundId: string, userId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      select: {
        id: true,
        type: true,
        status: true,
        closesAt: true,
        challengeId: true,
        challenge: { select: { title: true } },
      },
    });
    if (!round) throw new NotFoundException("Round not found");
    if (round.type !== "public_vote_final") {
      throw new BadRequestException("Predictions are available for the final public round only");
    }

    const [finalists, myPrediction, entrant] = await Promise.all([
      this.prisma.submission.findMany({
        where: { challengeId: round.challengeId, phase: "full_content", status: "advanced" },
        select: { id: true, creatorId: true },
        orderBy: { id: "asc" },
      }),
      this.prisma.prediction.findUnique({
        where: { userId_roundId: { userId, roundId } },
        select: { id: true, submissionId: true, correct: true, createdAt: true },
      }),
      this.prisma.submission.findFirst({
        where: { challengeId: round.challengeId, creatorId: userId },
        select: { id: true },
      }),
    ]);

    return {
      roundId: round.id,
      challengeTitle: round.challenge.title,
      status: round.status,
      closesAt: round.closesAt,
      canPredict: !entrant && round.status === "open" && !myPrediction,
      isEntrant: Boolean(entrant),
      options: finalists,
      prediction: myPrediction,
    };
  }

  async createPrediction(roundId: string, userId: string, submissionId: string) {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      select: { id: true, type: true, status: true, challengeId: true },
    });
    if (!round) throw new NotFoundException("Round not found");
    if (round.type !== "public_vote_final") {
      throw new BadRequestException("Predictions are available for the final public round only");
    }
    if (round.status !== "open") {
      throw new ConflictException("Predictions close when the round closes");
    }

    const [entrant, finalist] = await Promise.all([
      this.prisma.submission.findFirst({
        where: { challengeId: round.challengeId, creatorId: userId },
        select: { id: true },
      }),
      this.prisma.submission.findFirst({
        where: { id: submissionId, challengeId: round.challengeId, phase: "full_content", status: "advanced" },
        select: { id: true },
      }),
    ]);
    if (entrant) throw new ForbiddenException("Creators cannot predict their own challenge");
    if (!finalist) throw new BadRequestException("Choose a live finalist in this challenge");

    try {
      return await this.prisma.prediction.create({
        data: { userId, roundId, submissionId, lockedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("You already made a prediction for this round");
      }
      throw error;
    }
  }

  async settlePredictions(roundId: string, winnerSubmissionId: string): Promise<void> {
    await this.prisma.prediction.updateMany({
      where: { roundId },
      data: { correct: false },
    });
    await this.prisma.prediction.updateMany({
      where: { roundId, submissionId: winnerSubmissionId },
      data: { correct: true },
    });
  }
}
