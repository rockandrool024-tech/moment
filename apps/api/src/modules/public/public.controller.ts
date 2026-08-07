import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import {
  DiscoveryBrand,
  DiscoveryCreator,
  PublicChallengeSummary,
  PublicService,
  PublicTally,
} from "./public.service";

// The one surface designed to take anonymous, potentially viral traffic
// (ADR-002) — rate-limited independently of the rest of the API so a spike
// here can't be used to degrade account/payment/voting endpoints.
@Controller("public")
@UseGuards(ThrottlerGuard)
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
}
