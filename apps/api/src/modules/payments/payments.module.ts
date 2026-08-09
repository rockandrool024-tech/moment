import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { FundingService } from "./funding.service";
import { PayoutsService } from "./payouts.service";
import { ConnectOnboardingService } from "./connect-onboarding.service";
import { WalletService } from "./wallet.service";
import { WebhooksController } from "./webhooks.controller";
import { ConnectOnboardingController } from "./connect-onboarding.controller";
import { WalletController } from "./wallet.controller";
import { IdentityModule } from "../identity/identity.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [IdentityModule, NotificationsModule],
  controllers: [WebhooksController, ConnectOnboardingController, WalletController],
  providers: [StripeService, FundingService, PayoutsService, ConnectOnboardingService, WalletService],
  exports: [StripeService, FundingService, PayoutsService, WalletService],
})
export class PaymentsModule {}
