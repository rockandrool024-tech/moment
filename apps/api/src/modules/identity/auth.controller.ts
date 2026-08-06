import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { OtpService } from "./otp.service";
import { UsersService } from "./users.service";
import { JwtPayload } from "../../common/types/authenticated-request";

@Controller("auth/otp")
export class AuthController {
  constructor(
    private readonly otpService: OtpService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  @Post("request")
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestOtp(@Body() dto: RequestOtpDto): Promise<void> {
    await this.otpService.sendCode(dto.phone);
  }

  @Post("verify")
  async verifyOtp(@Body() dto: VerifyOtpDto): Promise<{ accessToken: string }> {
    const approved = await this.otpService.checkCode(dto.phone, dto.code);
    if (!approved) {
      throw new UnauthorizedException("Invalid or expired code");
    }

    const user = await this.usersService.findOrCreateVerified(dto.phone, dto.role);
    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
