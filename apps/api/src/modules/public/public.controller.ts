import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  DiscoveryBrand,
  DiscoveryCreator,
  FeedVideosResponse,
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
  getDiscoveryCreators(@Query("location") location?: string): Promise<DiscoveryCreator[]> {
    return this.publicService.getDiscoveryCreators(location);
  }

  @Get("discovery/brands")
  getDiscoveryBrands(@Query("location") location?: string): Promise<DiscoveryBrand[]> {
    return this.publicService.getDiscoveryBrands(location);
  }

  @Get("map/nearby")
  getMapNearby(): Promise<MapNearbyResponse> {
    return this.publicService.getMapNearby();
  }

  @Get("feed/videos")
  getFeedVideos(): Promise<FeedVideosResponse> {
    return this.publicService.getFeedVideos();
  }
}
