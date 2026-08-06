import { IsInt, IsObject, IsOptional, IsPositive, IsString, Max, Min } from "class-validator";

export class CreateChallengeDto {
  @IsString()
  title!: string;

  @IsString()
  brief!: string;

  // Round-1 auto-filter rules (e.g. required hashtag, min duration, aspect
  // ratio) — free-form per the campaign wizard, not modeled further yet.
  @IsObject()
  checklistCriteria!: Record<string, unknown>;

  // Minor units (cents).
  @IsInt()
  @IsPositive()
  prizePool!: number;

  // Minor units (cents). Defaults to 12% of prizePool if omitted (README/ADR-005).
  @IsInt()
  @IsPositive()
  @IsOptional()
  stipendPool?: number;

  // Basis points. 2000 = 20% flat rate (ADR-002). 1200 for in-person/local
  // campaigns per the still-unresolved 12%-vs-20% open question — caller's choice.
  @IsInt()
  @Min(0)
  @Max(10000)
  @IsOptional()
  takeRateBps?: number;
}
