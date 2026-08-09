import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration from "./common/config/configuration";
import { validateEnv } from "./common/config/env.validation";
import { PrismaModule } from "./common/prisma/prisma.module";
import { QueueModule } from "./common/queue/queue.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { IdentityModule } from "./modules/identity/identity.module";
import { ChallengesModule } from "./modules/challenges/challenges.module";
import { SubmissionsModule } from "./modules/submissions/submissions.module";
import { MediaModule } from "./modules/media/media.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { RoundsModule } from "./modules/rounds/rounds.module";
import { VotingModule } from "./modules/voting/voting.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PublicModule } from "./modules/public/public.module";
import { TrustModule } from "./modules/trust/trust.module";
import { HealthModule } from "./modules/health/health.module";
import { ReferralsModule } from "./modules/referrals/referrals.module";
import { AdminModule } from "./modules/admin/admin.module";
import { StoriesModule } from "./modules/stories/stories.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    // Global default (120 req/min) — was previously only bound locally on
    // PublicController, leaving every other endpoint (including auth/OTP)
    // completely unrated. PublicController keeps its own tighter @Throttle()
    // override on top of this.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    QueueModule,
    IdentityModule,
    ChallengesModule,
    SubmissionsModule,
    MediaModule,
    PaymentsModule,
    RoundsModule,
    VotingModule,
    NotificationsModule,
    PublicModule,
    TrustModule,
    HealthModule,
    ReferralsModule,
    AdminModule,
    StoriesModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
