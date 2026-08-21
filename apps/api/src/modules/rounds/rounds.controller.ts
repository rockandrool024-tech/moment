import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { Round, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RoundsService } from "./rounds.service";
import { CreateRoundDto } from "./dto/create-round.dto";
import { SetFinalPickDto } from "./dto/set-final-pick.dto";
import { CreatePredictionDto } from "./dto/create-prediction.dto";
import { PredictionsService } from "./predictions.service";

@Controller()
export class RoundsController {
  constructor(
    private readonly rounds: RoundsService,
    private readonly predictions: PredictionsService,
  ) {}

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

  @Get("rounds/:id/predictions")
  @UseGuards(JwtAuthGuard)
  getPredictions(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.predictions.getRoundPredictions(id, user.id);
  }

  @Post("rounds/:id/predictions")
  @UseGuards(JwtAuthGuard)
  createPrediction(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreatePredictionDto,
    @CurrentUser() user: User,
  ) {
    return this.predictions.createPrediction(id, user.id, dto.submissionId);
  }

  @Patch("rounds/:id/final-pick")
  @UseGuards(JwtAuthGuard)
  setFinalPick(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SetFinalPickDto,
    @CurrentUser() user: User,
  ): Promise<Round> {
    return this.rounds.setFinalPick(id, user.id, dto);
  }
}
