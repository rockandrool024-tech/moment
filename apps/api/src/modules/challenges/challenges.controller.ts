import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { Challenge, ChallengeStatus, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ChallengesService } from "./challenges.service";
import { CreateChallengeDto } from "./dto/create-challenge.dto";
import { FundingService, FundingResult } from "../payments/funding.service";

@Controller("challenges")
export class ChallengesController {
  constructor(
    private readonly challenges: ChallengesService,
    private readonly funding: FundingService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateChallengeDto, @CurrentUser() user: User): Promise<Challenge> {
    return this.challenges.create(user.id, dto);
  }

  @Get()
  findMany(@Query("status") status?: ChallengeStatus): Promise<Challenge[]> {
    return this.challenges.findMany(status);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string): Promise<Challenge> {
    return this.challenges.findByIdOrThrow(id);
  }

  @Post(":id/fund")
  @UseGuards(JwtAuthGuard)
  fund(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<FundingResult> {
    return this.funding.fundChallenge(id, user.id);
  }
}
