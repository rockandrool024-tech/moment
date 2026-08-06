import { Module } from "@nestjs/common";
import { MuxService } from "./mux.service";
import { MediaController } from "./media.controller";
import { MuxWebhooksController } from "./mux-webhooks.controller";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [IdentityModule],
  controllers: [MediaController, MuxWebhooksController],
  providers: [MuxService],
  exports: [MuxService],
})
export class MediaModule {}
