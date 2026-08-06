import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { UsersController } from "./users.controller";
import { OtpService } from "./otp.service";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PhoneVerifiedGuard } from "../../common/guards/phone-verified.guard";

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwt.secret"),
        signOptions: { expiresIn: config.get<string>("jwt.expiresIn") },
      }),
    }),
  ],
  controllers: [AuthController, UsersController],
  providers: [OtpService, UsersService, JwtAuthGuard, PhoneVerifiedGuard],
  exports: [UsersService, JwtAuthGuard, PhoneVerifiedGuard, JwtModule],
})
export class IdentityModule {}
