import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { Challenge, Dispute, Submission, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { AdminGuard } from "../../common/guards/admin.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AdminService, GrowthDashboard } from "./admin.service";
import { ResolveDisputeDto } from "./dto/resolve-dispute.dto";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("challenges")
  listChallenges(): Promise<Challenge[]> {
    return this.admin.listChallenges();
  }

  @Get("challenges/:id")
  getChallenge(@Param("id", ParseUUIDPipe) id: string) {
    return this.admin.getChallengeDetail(id);
  }

  @Get("rounds/stuck")
  listStuckRounds() {
    return this.admin.listStuckRounds();
  }

  @Post("rounds/:id/force-reveal")
  async forceReveal(@Param("id", ParseUUIDPipe) id: string): Promise<{ ok: true }> {
    await this.admin.forceRevealRound(id);
    return { ok: true };
  }

  @Post("submissions/:id/eliminate")
  eliminateSubmission(@Param("id", ParseUUIDPipe) id: string): Promise<Submission> {
    return this.admin.eliminateSubmission(id);
  }

  @Get("kyb-queue")
  listKybQueue(): Promise<User[]> {
    return this.admin.listKybQueue();
  }

  @Post("users/:id/kyb-approve")
  approveKyb(@Param("id", ParseUUIDPipe) id: string): Promise<User> {
    return this.admin.approveKyb(id);
  }

  @Post("users/:id/kyb-reject")
  rejectKyb(@Param("id", ParseUUIDPipe) id: string): Promise<User> {
    return this.admin.rejectKyb(id);
  }

  @Get("disputes")
  listDisputes(@Query("status") status?: "open" | "upheld" | "denied"): Promise<Dispute[]> {
    return this.admin.listDisputes(status);
  }

  @Patch("disputes/:id")
  resolveDispute(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeDto,
    @CurrentUser() user: User,
  ): Promise<Dispute> {
    return this.admin.resolveDispute(id, user.id, dto.status, dto.resolution);
  }

  @Get("growth-dashboard")
  getGrowthDashboard(): Promise<GrowthDashboard> {
    return this.admin.getGrowthDashboard();
  }
}
