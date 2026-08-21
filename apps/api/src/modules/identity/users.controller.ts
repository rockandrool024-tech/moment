import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { JourneyMilestone } from "./journey";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateCharacterDto } from "./dto/update-character.dto";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  me(@CurrentUser() user: User): User {
    return user;
  }

  // Records a real request timestamp rather than a no-op — the admin queue
  // (Sprint 4) filters on kybRequestedAt != null, so this is what turns
  // "every unverified user" into "who's actually asking."
  @Post("me/request-kyb")
  requestKyb(@CurrentUser() user: User): Promise<User> {
    return this.users.requestKyb(user.id);
  }

  // Public, unauthenticated serving happens in avatar.controller.ts — this
  // stays here since it's a /users/me/* mutation like requestKyb above.
  @Post("me/avatar/generate")
  generateAvatar(@CurrentUser() user: User): Promise<User> {
    return this.users.generateAvatar(user.id);
  }

  @Get("me/journey")
  getJourney(@CurrentUser() user: User): Promise<JourneyMilestone[]> {
    return this.users.getJourney(user.id);
  }

  @Patch("me")
  updateProfile(@CurrentUser() user: User, @Body() dto: UpdateProfileDto): Promise<User> {
    return this.users.updateProfile(user.id, dto);
  }

  @Get("me/character")
  getCharacter(@CurrentUser() user: User): Promise<{ preset: string; palette: string; updatedAt: string | null }> {
    return this.users.getCharacter(user.id);
  }

  @Patch("me/character")
  updateCharacter(@CurrentUser() user: User, @Body() dto: UpdateCharacterDto): Promise<{ preset: string; palette: string; updatedAt: string | null }> {
    return this.users.updateCharacter(user.id, dto);
  }
}
