import { Module } from "@nestjs/common";
import { TrustService } from "./trust.service";
import { TrustController } from "./trust.controller";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [IdentityModule],
  controllers: [TrustController],
  providers: [TrustService],
  exports: [TrustService],
})
export class TrustModule {}
