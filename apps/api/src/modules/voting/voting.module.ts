import { Module } from "@nestjs/common";
import { DeckService } from "./deck.service";
import { VotingService } from "./voting.service";
import { VotingController } from "./voting.controller";
import { RoundsModule } from "../rounds/rounds.module";
import { IdentityModule } from "../identity/identity.module";

@Module({
  imports: [RoundsModule, IdentityModule],
  controllers: [VotingController],
  providers: [DeckService, VotingService],
  exports: [DeckService, VotingService],
})
export class VotingModule {}
