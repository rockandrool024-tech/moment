import { Module } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service";
import { SubmissionsController } from "./submissions.controller";
import { IdentityModule } from "../identity/identity.module";
import { ReferralsModule } from "../referrals/referrals.module";

@Module({
  imports: [IdentityModule, ReferralsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
