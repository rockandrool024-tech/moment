import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { Rating, User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TrustService, TrustStats } from "./trust.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

@Controller()
export class TrustController {
  constructor(private readonly trust: TrustService) {}

  @Post("ratings")
  @UseGuards(JwtAuthGuard)
  createRating(@Body() dto: CreateRatingDto, @CurrentUser() user: User): Promise<Rating> {
    return this.trust.createRating(user.id, dto);
  }

  // Public — trust stats are the moat and are meant to be shared/screenshot.
  @Get("users/:id/trust-stats")
  getTrustStats(@Param("id", ParseUUIDPipe) id: string): Promise<TrustStats> {
    return this.trust.getTrustStats(id);
  }

  // Ratings given BY the current user for this challenge — lets the UI show
  // "already rated" instead of re-prompting (a seller can rate several
  // finalists, so this is a list, not a single nullable rating).
  @Get("challenges/:id/ratings/mine")
  @UseGuards(JwtAuthGuard)
  getMyRatings(
    @Param("id", ParseUUIDPipe) challengeId: string,
    @CurrentUser() user: User,
  ): Promise<Rating[]> {
    return this.trust.getRatingsGivenByUser(challengeId, user.id);
  }
}
