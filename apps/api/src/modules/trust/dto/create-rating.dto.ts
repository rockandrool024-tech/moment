import { IsInt, IsUUID, Max, Min } from "class-validator";

export class CreateRatingDto {
  @IsUUID()
  challengeId!: string;

  @IsUUID()
  rateeId!: string;

  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;
}
