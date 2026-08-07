import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { Round, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RoundsService } from "./rounds.service";
import { CreateRoundDto } from "./dto/create-round.dto";

@Controller()
export class RoundsController {
  constructor(private readonly rounds: RoundsService) {}

  @Post("challenges/:challengeId/rounds")
  @UseGuards(JwtAuthGuard)
  create(
    @Param("challengeId", ParseUUIDPipe) challengeId: string,
    @Body() dto: CreateRoundDto,
    @CurrentUser() user: User,
  ): Promise<Round> {
    return this.rounds.create(challengeId, user.id, dto);
  }

  @Post("challenges/:challengeId/rounds/auto")
  @UseGuards(JwtAuthGuard)
  createNext(
    @Param("challengeId", ParseUUIDPipe) challengeId: string,
    @CurrentUser() user: User,
  ): Promise<Round> {
    return this.rounds.createNext(challengeId, user.id);
  }

  @Get("challenges/:challengeId/rounds")
  findByChallenge(@Param("challengeId", ParseUUIDPipe) challengeId: string): Promise<Round[]> {
    return this.rounds.findByChallenge(challengeId);
  }

  @Get("rounds/:id")
  findOne(@Param("id", ParseUUIDPipe) id: string): Promise<Round> {
    return this.rounds.findByIdOrThrow(id);
  }
}
