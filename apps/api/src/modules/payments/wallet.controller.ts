import { Controller, Get, UseGuards } from "@nestjs/common";
import { User } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { WalletService, WalletSummary } from "./wallet.service";

@Controller("users/me/wallet")
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  @Get()
  get(@CurrentUser() user: User): Promise<WalletSummary> {
    return this.wallet.getWallet(user.id);
  }
}
