import { Module } from "@nestjs/common";
import { PublicController } from "./public.controller";
import { PublicService } from "./public.service";
import { PublicCacheService } from "./public-cache.service";

// ThrottlerModule.forRoot() now lives once, globally, in AppModule —
// duplicating it here would register a second throttler storage/guard
// instance. PublicController's own tighter @Throttle() override still
// applies on top of the global default.
@Module({
  controllers: [PublicController],
  providers: [PublicService, PublicCacheService],
  exports: [PublicCacheService],
})
export class PublicModule {}
