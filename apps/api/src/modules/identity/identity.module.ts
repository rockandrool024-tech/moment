import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { UsersController } from "./users.controller";
import { AvatarController } from "./avatar.controller";
import { OtpService } from "./otp.service";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PhoneVerifiedGuard } from "../../common/guards/phone-verified.guard";
import { PublicModule } from "../public/public.module";

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
    PublicModule, // avatar.controller.ts reuses PublicCacheService rather than a second Redis client
  ],
  controllers: [AuthController, UsersController, AvatarController],
  providers: [OtpService, UsersService, JwtAuthGuard, PhoneVerifiedGuard],
  exports: [UsersService, JwtAuthGuard, PhoneVerifiedGuard, JwtModule],
})
export class IdentityModule {}
