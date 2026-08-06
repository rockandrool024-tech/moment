import { Controller, Get, UseGuards } from "@nestjs/common";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  @Get("me")
  me(@CurrentUser() user: User): User {
    return user;
  }
}
