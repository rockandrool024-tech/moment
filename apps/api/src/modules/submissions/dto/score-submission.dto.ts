import { IsInt, Max, Min } from "class-validator";

export class ScoreSubmissionDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;
}
