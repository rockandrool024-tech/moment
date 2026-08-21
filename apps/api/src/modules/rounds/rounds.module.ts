import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { RoundsService } from "./rounds.service";
import { RoundStateMachineService } from "./round-state-machine.service";
import { RoundsController } from "./rounds.controller";
import { RoundsProcessor } from "./jobs/rounds.processor";
import { PredictionsService } from "./predictions.service";
import { PaymentsModule } from "../payments/payments.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [
    BullModule.registerQueue({ name: "rounds" }),
    PaymentsModule,
    NotificationsModule,
    IdentityModule,
  ],
  controllers: [RoundsController],
  providers: [RoundsService, RoundStateMachineService, RoundsProcessor, PredictionsService],
  exports: [RoundsService, RoundStateMachineService],
})
export class RoundsModule {}
