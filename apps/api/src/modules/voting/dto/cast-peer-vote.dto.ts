import { IsInt, IsNumber, IsUUID, Min } from "class-validator";

export class CastPeerVoteDto {
  @IsUUID()
  deckId!: string;

  @IsInt()
  @Min(0)
  pairIndex!: number;

  @IsUUID()
  winnerSubmissionId!: string;

  @IsNumber()
  @Min(0)
  viewDurationMs!: number;
}
