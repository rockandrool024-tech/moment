import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { IsIn } from "class-validator";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { CoinsService, COIN_PACKAGES } from "./coins.service";

class PurchaseCoinsDto {
  @IsIn(COIN_PACKAGES.map((p) => p.id))
  packageId!: string;
}

@Controller("users/me/coins")
@UseGuards(JwtAuthGuard)
export class CoinsController {
  constructor(private readonly coins: CoinsService) {}

  @Get()
  async getMine(@CurrentUser() user: User) {
    const { coinBalance } = await this.coins.getBalance(user.id);
    return { coinBalance, packages: COIN_PACKAGES };
  }

  @Get("purchases")
  myPurchases(@CurrentUser() user: User) {
    return this.coins.myPurchases(user.id);
  }

  @Post("purchase")
  purchase(@Body() dto: PurchaseCoinsDto, @CurrentUser() user: User) {
    return this.coins.purchase(user.id, dto.packageId);
  }
}
