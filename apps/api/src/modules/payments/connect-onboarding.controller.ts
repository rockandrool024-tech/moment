import { Controller, Post, UseGuards } from "@nestjs/common";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ConnectOnboardingService } from "./connect-onboarding.service";

@Controller("users/me/stripe-connect-onboarding")
@UseGuards(JwtAuthGuard)
export class ConnectOnboardingController {
  constructor(private readonly onboarding: ConnectOnboardingService) {}

  @Post()
  create(@CurrentUser() user: User): Promise<{ url: string }> {
    return this.onboarding.createOnboardingLink(user);
  }
}
