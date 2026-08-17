import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  displayName?: string;

  // Free-text, user-entered — "Brooklyn, NY". Never geocoded, never GPS.
  @IsOptional()
  @IsString()
  @MaxLength(80)
  location?: string;
}
