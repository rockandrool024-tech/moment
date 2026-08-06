import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ChallengeStatus, Round } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateRoundDto } from "./dto/create-round.dto";
import { RoundStateMachineService } from "./round-state-machine.service";

const EXPECTED_CHALLENGE_STATUS_BY_ROUND: Record<number, ChallengeStatus> = {
  1: "funded",
  2: "round1_open",
  3: "round2_open",
};

const CHALLENGE_STATUS_FOR_ROUND: Record<number, ChallengeStatus> = {
  1: "round1_open",
  2: "round2_open",
  3: "round3_open",
};

@Injectable()
export class RoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: RoundStateMachineService,
  ) {}

  async create(challengeId: string, sellerId: string, dto: CreateRoundDto): Promise<Round> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException("Challenge not found");
    if (challenge.sellerId !== sellerId) {
      throw new ForbiddenException("Only the owning seller can open a round");
    }

    const expectedStatus = EXPECTED_CHALLENGE_STATUS_BY_ROUND[dto.roundNumber];
    if (!expectedStatus) {
      throw new BadRequestException("roundNumber must be 1, 2, or 3");
    }
    if (challenge.status !== expectedStatus) {
      throw new BadRequestException(
        `Challenge must be '${expectedStatus}' to open round ${dto.roundNumber} (currently '${challenge.status}')`,
      );
    }

    const closesAt = new Date(dto.closesAt);
    const revealDeadlineMs = 2 * 60 * 60 * 1000; // ADR-003: 2h stall-prevention deadline
    const revealDeadlineAt = new Date(closesAt.getTime() + revealDeadlineMs);

    const round = await this.prisma.$transaction(async (tx) => {
      const created = await tx.round.create({
        data: {
          challengeId,
          roundNumber: dto.roundNumber,
          type: dto.type,
          advanceCount: dto.advanceCount,
          opensAt: new Date(dto.opensAt),
          closesAt,
          revealDeadlineAt,
        },
      });
      await tx.challenge.update({
        where: { id: challengeId },
        data: { status: CHALLENGE_STATUS_FOR_ROUND[dto.roundNumber] },
      });
      return created;
    });

    await this.stateMachine.scheduleRoundJobs(round);
    return round;
  }

  async findByIdOrThrow(id: string): Promise<Round> {
    const round = await this.prisma.round.findUnique({ where: { id } });
    if (!round) throw new NotFoundException("Round not found");
    return round;
  }

  findByChallenge(challengeId: string): Promise<Round[]> {
    return this.prisma.round.findMany({
      where: { challengeId },
      orderBy: { roundNumber: "asc" },
    });
  }
}
