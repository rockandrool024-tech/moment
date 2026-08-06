import { Module } from "@nestjs/common";
import { ChallengesService } from "./challenges.service";
import { ChallengesController } from "./challenges.controller";
import { PaymentsModule } from "../payments/payments.module";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [PaymentsModule, IdentityModule],
  controllers: [ChallengesController],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {}
