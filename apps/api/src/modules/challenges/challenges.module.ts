import { Module } from "@nestjs/common";
import { ChallengesService } from "./challenges.service";
import { ChallengesController } from "./challenges.controller";
import { PaymentsModule } from "../payments/payments.module";
import { IdentityModule } from "../identity/identity.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PaymentsModule, IdentityModule, NotificationsModule],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
