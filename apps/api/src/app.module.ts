import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
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
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
})
export class AppModule {}
