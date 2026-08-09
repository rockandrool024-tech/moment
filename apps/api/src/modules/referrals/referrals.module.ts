import { Module } from "@nestjs/common";
import { ReferralsService } from "./referrals.service";
import { ReferralsController } from "./referrals.controller";
import { PaymentsModule } from "../payments/payments.module";
import { IdentityModule } from "../identity/identity.module";

// IdentityModule's AuthController creates the ReferralReward row directly
// via PrismaService rather than depending on this module — specifically so
// IdentityModule never has to import ReferralsModule, which would cycle
// back through PaymentsModule (which itself imports IdentityModule).
@Module({
  imports: [PaymentsModule, IdentityModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService],
})
export class ReferralsModule {}
