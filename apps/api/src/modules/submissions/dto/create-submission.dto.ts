import { IsIn, IsNumber, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateSubmissionDto {
  @IsUUID()
  challengeId!: string;

  @IsIn(["teaser", "full_content"])
  phase!: "teaser" | "full_content";

  @IsNumber()
  @IsOptional()
  durationSeconds?: number;

  @IsString()
  @IsOptional()
  caption?: string;
}
