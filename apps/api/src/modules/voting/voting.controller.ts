import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { Deck, RallyAttribution, User, Vote } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PhoneVerifiedGuard } from "../../common/guards/phone-verified.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DeckService, CastPeerVoteResult } from "./deck.service";
import { VotingService } from "./voting.service";
import { CastPeerVoteDto } from "./dto/cast-peer-vote.dto";
import { CastVoteDto } from "./dto/cast-vote.dto";
import { RecordRallyAttributionDto } from "./dto/record-rally-attribution.dto";

// Every route here requires phone verification (ADR-001 action item 5) —
// composed on top of JwtAuthGuard, never standing in for it.
@Controller()
@UseGuards(JwtAuthGuard, PhoneVerifiedGuard)
export class VotingController {
  constructor(
    private readonly deckService: DeckService,
    private readonly votingService: VotingService,
  ) {}

  @Post("rounds/:roundId/decks")
  generateDeck(
    @Param("roundId", ParseUUIDPipe) roundId: string,
    @CurrentUser() user: User,
  ): Promise<Deck> {
    return this.deckService.generateDeck(user.id, roundId);
  }

  @Post("peer-votes")
  castPeerVote(@Body() dto: CastPeerVoteDto, @CurrentUser() user: User): Promise<CastPeerVoteResult> {
    return this.deckService.castVote(
      user.id,
      dto.deckId,
      dto.pairIndex,
      dto.winnerSubmissionId,
      dto.viewDurationMs,
    );
  }

  @Post("rounds/:roundId/votes")
  castVote(
    @Param("roundId", ParseUUIDPipe) roundId: string,
    @Body() dto: CastVoteDto,
    @CurrentUser() user: User,
  ): Promise<Vote> {
    return this.votingService.castVote(user.id, roundId, dto.submissionId);
  }

  @Post("rally-attributions")
  recordRallyAttribution(
    @Body() dto: RecordRallyAttributionDto,
    @CurrentUser() user: User,
  ): Promise<RallyAttribution> {
    return this.votingService.recordRallyAttribution(user.id, dto.creatorId, dto.campaignId);
  }
}
