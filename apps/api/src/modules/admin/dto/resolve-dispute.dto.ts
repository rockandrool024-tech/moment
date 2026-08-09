import { IsIn, IsString, MinLength } from "class-validator";

export class ResolveDisputeDto {
  @IsIn(["upheld", "denied"])
  status!: "upheld" | "denied";

  @IsString()
  @MinLength(1)
  resolution!: string;
}
