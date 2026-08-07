import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";
import { PublicCacheService } from "./public-cache.service";

@Module({
  imports: [
    // Default limits apply everywhere ThrottlerGuard is used; PublicController
    // overrides them with its own tighter @Throttle() — see there for why.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
  ],
  controllers: [PublicController],
  providers: [PublicService, PublicCacheService],
  exports: [PublicCacheService],
})
export class PublicModule {}
