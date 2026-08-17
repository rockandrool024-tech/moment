import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { NotificationsService } from "./notifications.service";
import { NotificationsProcessor } from "./notifications.processor";
import { NotificationsController } from "./notifications.controller";
import { PushService } from "./push.service";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [BullModule.registerQueue({ name: "notifications" }), IdentityModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsProcessor, PushService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
