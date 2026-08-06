import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { User } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StripeService } from "./stripe.service";

// Populates User.stripeConnectAccountId, which PayoutsService.transferOne
// (see payouts.service.ts) requires before it can transfer a payout — this
// is the missing half of ADR-001 action item 2 ("escrow + payout flow").
@Injectable()
export class ConnectOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly config: ConfigService,
  ) {}

  async createOnboardingLink(user: User): Promise<{ url: string }> {
    let accountId = user.stripeConnectAccountId;

    if (!accountId) {
      const account = await this.stripe.get().accounts.create({
        type: "express",
        capabilities: {
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { stripeConnectAccountId: accountId },
      });
    }

    const appUrl = this.config.get<string>("appUrl") ?? "http://localhost:3001";
    const accountLink = await this.stripe.get().accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${appUrl}/me?stripe=refresh`,
      return_url: `${appUrl}/me?stripe=complete`,
    });

    return { url: accountLink.url };
  }
}
