import { IsIn, IsOptional, IsString } from "class-validator";

export const CHARACTER_PRESETS = ["parrot", "street", "studio", "night"] as const;
export const CHARACTER_PALETTES = ["tropical", "coral", "midnight", "sand"] as const;

export type CharacterPreset = (typeof CHARACTER_PRESETS)[number];
export type CharacterPalette = (typeof CHARACTER_PALETTES)[number];

export class UpdateCharacterDto {
  @IsOptional()
  @IsString()
  @IsIn(CHARACTER_PRESETS)
  preset?: CharacterPreset;

  @IsOptional()
  @IsString()
  @IsIn(CHARACTER_PALETTES)
  palette?: CharacterPalette;
}
