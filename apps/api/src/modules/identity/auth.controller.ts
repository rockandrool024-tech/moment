import { Body, Controller, HttpCode, HttpStatus, Post, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { RequestOtpDto } from "./dto/request-otp.dto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";
import { OtpService } from "./otp.service";
import { UsersService } from "./users.service";
import { JwtPayload } from "../../common/types/authenticated-request";
import { PrismaService } from "../../common/prisma/prisma.service";

@Controller("auth/otp")
export class AuthController {
  constructor(
    private readonly otpService: OtpService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
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

    const existing = await this.usersService.findByPhone(dto.phone);
    const user = await this.usersService.findOrCreateVerified(dto.phone, dto.role);

    // Referral loop 3 attribution — only on a genuinely new account, never
    // a returning user replaying a login with a stray ?ref= param. Kept
    // inline (not a ReferralsService call) so IdentityModule never has to
    // depend on ReferralsModule — see referrals.module.ts for why.
    if (!existing && dto.referralCode) {
      const referrer = await this.prisma.user.findUnique({
        where: { referralCode: dto.referralCode },
      });
      if (referrer && referrer.id !== user.id) {
        try {
          await this.prisma.referralReward.create({
            data: { referrerId: referrer.id, refereeId: user.id },
          });
        } catch {
          // refereeId is @unique — ignore a duplicate-attribution race.
        }
      }
    }

    const payload: JwtPayload = { sub: user.id, phone: user.phone };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken };
  }
}
