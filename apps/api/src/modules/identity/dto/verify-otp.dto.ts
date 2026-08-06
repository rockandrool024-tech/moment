import { IsIn, IsPhoneNumber, IsString, Length } from "class-validator";

export class VerifyOtpDto {
  @IsPhoneNumber(undefined, { message: "phone must be a valid E.164 number, e.g. +15551234567" })
  phone!: string;

  @IsString()
  @Length(4, 10)
  code!: string;

  @IsIn(["seller", "creator", "both"])
  role!: "seller" | "creator" | "both";
}
