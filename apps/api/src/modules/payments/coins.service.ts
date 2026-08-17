import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CoinPurchase } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CryptoService } from "./crypto.service";

export interface CoinPackage {
  id: string;
  coins: number;
  priceUsd: number;
  label: string;
}

// Flat, deliberately small — three fixed packages, not a configurable
// pricing table. This currency only ever buys cosmetics (see schema.prisma's
// CoinPurchase comment), so there's no pricing-strategy surface worth
// building yet; add packages here when a real cosmetic store exists to sell
// them into.
export const COIN_PACKAGES: CoinPackage[] = [
  { id: "coins_100", coins: 100, priceUsd: 5, label: "100 coins" },
  { id: "coins_500", coins: 500, priceUsd: 20, label: "500 coins" },
  { id: "coins_1200", coins: 1200, priceUsd: 40, label: "1,200 coins" },
];

@Injectable()
export class CoinsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly config: ConfigService,
  ) {}

  async getBalance(userId: string): Promise<{ coinBalance: number }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { coinBalance: true },
    });
    return user;
  }

  async purchase(userId: string, packageId: string): Promise<{ checkoutUrl: string }> {
    const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) throw new BadRequestException("Unknown coin package");

    const appUrl = this.config.get<string>("appUrl") ?? "http://localhost:3001";
    const charge = await this.crypto.createCharge({
      name: pkg.label,
      description: `Perokio cosmetic coins — ${pkg.label}`,
      amountUsd: pkg.priceUsd,
      metadata: { userId, packageId, coins: String(pkg.coins) },
      redirectUrl: `${appUrl}/wallet?coins=success`,
      cancelUrl: `${appUrl}/wallet?coins=cancelled`,
    });

    await this.prisma.coinPurchase.create({
      data: {
        userId,
        coins: pkg.coins,
        priceUsdCents: Math.round(pkg.priceUsd * 100),
        providerChargeId: charge.id,
      },
    });

    return { checkoutUrl: charge.hosted_url };
  }

  /**
   * Called from the Coinbase Commerce webhook once a charge confirms.
   * Atomically claims the CoinPurchase row (pending -> completed) before
   * crediting the balance, so a redelivered webhook can never double-credit
   * — same conditional-update pattern as the round state machine's own
   * double-payout fix.
   */
  async markCompleted(providerChargeId: string): Promise<void> {
    const purchase = await this.prisma.coinPurchase.findUnique({ where: { providerChargeId } });
    if (!purchase) throw new NotFoundException(`No CoinPurchase for charge ${providerChargeId}`);

    const claimed = await this.prisma.coinPurchase.updateMany({
      where: { id: purchase.id, status: "pending" },
      data: { status: "completed", completedAt: new Date() },
    });
    if (claimed.count === 0) return; // already processed by an earlier webhook delivery

    await this.prisma.user.update({
      where: { id: purchase.userId },
      data: { coinBalance: { increment: purchase.coins } },
    });
  }

  async markExpired(providerChargeId: string): Promise<void> {
    await this.prisma.coinPurchase.updateMany({
      where: { providerChargeId, status: "pending" },
      data: { status: "expired" },
    });
  }

  myPurchases(userId: string): Promise<CoinPurchase[]> {
    return this.prisma.coinPurchase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  }
}
