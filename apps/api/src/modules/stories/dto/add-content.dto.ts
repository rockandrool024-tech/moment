import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, Min, MinLength, ValidateNested } from "class-validator";

export class ExternalPostInputDto {
  @IsString()
  @MinLength(1)
  platform!: string;

  @IsString()
  @MinLength(1)
  url!: string;

  // Creator-entered — display only, never read by scoring/tally/payout.
  @IsInt()
  @Min(0)
  @IsOptional()
  views?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  likes?: number;
}

export class AddContentDto {
  @IsString()
  @IsOptional()
  mediaUrl?: string;

  @IsString()
  @IsOptional()
  caption?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalPostInputDto)
  @IsOptional()
  externalPosts?: ExternalPostInputDto[];
}
