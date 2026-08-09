import { Controller, Get, UseGuards } from "@nestjs/common";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ReferralsService, ReferralStats } from "./referrals.service";

@Controller("users/me/referrals")
@UseGuards(JwtAuthGuard)
export class ReferralsController {
  constructor(private readonly referrals: ReferralsService) {}

  @Get()
  getStats(@CurrentUser() user: User): Promise<ReferralStats> {
    return this.referrals.getStats(user.id);
  }
}
