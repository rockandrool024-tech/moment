import { Module } from "@nestjs/common";
import { DeckService } from "./deck.service";
import { VotingService } from "./voting.service";
import { StreakService } from "./streak.service";
import { VotingController } from "./voting.controller";
import { RallyController } from "./rally.controller";
import { RoundsModule } from "../rounds/rounds.module";
import { IdentityModule } from "../identity/identity.module";
import { ReferralsModule } from "../referrals/referrals.module";

@Module({
  imports: [RoundsModule, IdentityModule, ReferralsModule],
  controllers: [VotingController, RallyController],
  providers: [DeckService, VotingService, StreakService],
  exports: [DeckService, VotingService, StreakService],
})
export class VotingModule {}
