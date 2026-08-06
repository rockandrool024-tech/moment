import { Injectable, NotFoundException } from "@nestjs/common";
import { Challenge, ChallengeStatus } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateChallengeDto } from "./dto/create-challenge.dto";

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  create(sellerId: string, dto: CreateChallengeDto): Promise<Challenge> {
    return this.prisma.challenge.create({
      data: {
        sellerId,
        title: dto.title,
        brief: dto.brief,
        checklistCriteria: dto.checklistCriteria as object,
        prizePool: dto.prizePool,
        stipendPool: dto.stipendPool ?? Math.round(dto.prizePool * 0.12),
        takeRateBps: dto.takeRateBps ?? 2000,
      },
    });
  }

  findMany(status?: ChallengeStatus): Promise<Challenge[]> {
    return this.prisma.challenge.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async findByIdOrThrow(id: string): Promise<Challenge> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id } });
    if (!challenge) throw new NotFoundException("Challenge not found");
    return challenge;
  }
}
