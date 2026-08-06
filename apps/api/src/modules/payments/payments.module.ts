import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { FundingService } from "./funding.service";
import { PayoutsService } from "./payouts.service";
import { ConnectOnboardingService } from "./connect-onboarding.service";
import { WebhooksController } from "./webhooks.controller";
import { ConnectOnboardingController } from "./connect-onboarding.controller";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [IdentityModule],
  controllers: [WebhooksController, ConnectOnboardingController],
  providers: [StripeService, FundingService, PayoutsService, ConnectOnboardingService],
  exports: [StripeService, FundingService, PayoutsService],
})
export class PaymentsModule {}
