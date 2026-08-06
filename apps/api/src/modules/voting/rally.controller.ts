import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { VotingService } from "./voting.service";

@Controller()
export class RallyController {
  constructor(private readonly votingService: VotingService) {}

  // Public — this is what a shared rally link (/v/{code} on the web app)
  // resolves against before the visitor has logged in at all.
  @Get("rally/:code/resolve")
  resolve(@Param("code") code: string): Promise<{ creatorId: string; challengeId: string }> {
    return this.votingService.resolveRallyCode(code);
  }

  @Get("users/me/rally-stats")
  @UseGuards(JwtAuthGuard)
  stats(@CurrentUser() user: User): Promise<{ totalVoters: number; rallyXp: number }> {
    return this.votingService.getRallyStats(user.id);
  }
}
