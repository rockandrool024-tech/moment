import { IsPhoneNumber } from "class-validator";

export class RequestOtpDto {
  @IsPhoneNumber(undefined, { message: "phone must be a valid E.164 number, e.g. +15551234567" })
  phone!: string;
}
