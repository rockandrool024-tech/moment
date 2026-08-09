import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from "@nestjs/common";
import { Dispute, Submission, SubmissionPhase, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SubmissionsService } from "./submissions.service";
import { CreateSubmissionDto } from "./dto/create-submission.dto";
import { ScoreSubmissionDto } from "./dto/score-submission.dto";
import { RaiseDisputeDto } from "./dto/raise-dispute.dto";

@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateSubmissionDto, @CurrentUser() user: User): Promise<Submission> {
    return this.submissions.create(user.id, dto);
  }

  @Post(":id/score")
  @UseGuards(JwtAuthGuard)
  score(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ScoreSubmissionDto,
    @CurrentUser() user: User,
  ): Promise<Submission> {
    return this.submissions.scoreBySeller(id, user.id, dto.score);
  }

  @Get()
  findMany(
    @Query("challengeId") challengeId?: string,
    @Query("phase") phase?: SubmissionPhase,
    @Query("creatorId") creatorId?: string,
  ): Promise<Submission[]> {
    return this.submissions.findMany({ challengeId, phase, creatorId });
  }

  @Post(":id/dispute")
  @UseGuards(JwtAuthGuard)
  raiseDispute(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RaiseDisputeDto,
    @CurrentUser() user: User,
  ): Promise<Dispute> {
    return this.submissions.raiseDispute(id, user.id, dto.reason);
  }

  // Public — no guard. Powers the shareable /results/[submissionId] page and
  // its opengraph-image (see apps/web), which unauthenticated visitors hit
  // directly from a shared link.
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.submissions.findByIdWithOutcome(id);
  }
}
