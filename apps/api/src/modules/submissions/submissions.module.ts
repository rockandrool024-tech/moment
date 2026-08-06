import { Module } from "@nestjs/common";
import { SubmissionsService } from "./submissions.service";
import { SubmissionsController } from "./submissions.controller";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [IdentityModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
  exports: [SubmissionsService],
})
export class SubmissionsModule {}
