import { IsString, MinLength } from "class-validator";

// access/mode are deliberately not settable here — every Story created
// through this endpoint is FREE/OPEN (the model's own defaults). PAID or
// CHALLENGE-mode Stories only ever come from the existing /challenges flow
// (see ChallengesService.create) or the backfill script; this session
// doesn't wire a path for the client to request either directly.
export class CreateStoryDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  brief!: string;
}
