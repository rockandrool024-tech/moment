import { IsDateString, IsIn, IsInt, IsPositive } from "class-validator";

export class CreateRoundDto {
  @IsInt()
  @IsPositive()
  roundNumber!: number;

  @IsIn(["peer_vote_teaser", "peer_vote_narrow", "public_vote_final"])
  type!: "peer_vote_teaser" | "peer_vote_narrow" | "public_vote_final";

  @IsInt()
  @IsPositive()
  advanceCount!: number;

  @IsDateString()
  opensAt!: string;

  @IsDateString()
  closesAt!: string;
}
