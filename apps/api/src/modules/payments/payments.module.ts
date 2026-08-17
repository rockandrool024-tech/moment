import { Module } from "@nestjs/common";
import { StripeService } from "./stripe.service";
import { FundingService } from "./funding.service";
import { PayoutsService } from "./payouts.service";
import { ConnectOnboardingService } from "./connect-onboarding.service";
import { WalletService } from "./wallet.service";
import { CryptoService } from "./crypto.service";
import { CoinsService } from "./coins.service";
import { WebhooksController } from "./webhooks.controller";
import { CoinbaseWebhooksController } from "./coinbase-webhooks.controller";
import { ConnectOnboardingController } from "./connect-onboarding.controller";
import { WalletController } from "./wallet.controller";
import { CoinsController } from "./coins.controller";
import { IdentityModule } from "../identity/identity.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [IdentityModule, NotificationsModule],
  controllers: [
    WebhooksController,
    CoinbaseWebhooksController,
    ConnectOnboardingController,
    WalletController,
    CoinsController,
  ],
  providers: [
    StripeService,
    FundingService,
    PayoutsService,
    ConnectOnboardingService,
    WalletService,
    CryptoService,
    CoinsService,
  ],
  exports: [StripeService, FundingService, PayoutsService, WalletService, CoinsService],
})
export class PaymentsModule {}
