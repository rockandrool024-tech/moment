import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  DiscoveryBrand,
  DiscoveryCreator,
  MapNearbyResponse,
  PublicChallengeSummary,
  PublicService,
  PublicTally,
} from "./public.service";

// The one surface designed to take anonymous, potentially viral traffic
// (ADR-002) — tighter-throttled than the app-wide default (bound globally
// in AppModule) so a spike here can't be used to degrade account/payment/
// voting endpoints. No local @UseGuards(ThrottlerGuard) needed — the global
// guard already applies everywhere; @Throttle() below just overrides its
// limit for this controller.
@Controller("public")
@Throttle({ default: { limit: 30, ttl: 60_000 } })
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get("challenges/:id")
  getChallenge(@Param("id", ParseUUIDPipe) id: string): Promise<PublicChallengeSummary> {
    return this.publicService.getChallengeSummary(id);
  }

  @Get("challenges/:id/tally")
  getTally(@Param("id", ParseUUIDPipe) id: string): Promise<PublicTally> {
    return this.publicService.getCurrentTally(id);
  }

  @Get("discovery/creators")
  getDiscoveryCreators(): Promise<DiscoveryCreator[]> {
    return this.publicService.getDiscoveryCreators();
  }

  @Get("discovery/brands")
  getDiscoveryBrands(): Promise<DiscoveryBrand[]> {
    return this.publicService.getDiscoveryBrands();
  }

  @Get("map/nearby")
  getMapNearby(): Promise<MapNearbyResponse> {
    return this.publicService.getMapNearby();
  }
}
