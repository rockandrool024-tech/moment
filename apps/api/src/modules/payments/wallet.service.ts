import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface WalletPayoutRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  challengeName: string;
  createdAt: string;
  paidAt: string | null;
}

export interface WalletSummary {
  currentBalanceCents: number;
  lifetimeEarningsCents: number;
  pendingPayoutsCents: number;
  payoutHistory: WalletPayoutRow[];
}

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string): Promise<WalletSummary> {
    const payouts = await this.prisma.payout.findMany({
      where: { userId },
      include: { challenge: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
    });

    // "Earned" the moment a payout is created, not only once paidAt is set —
    // winning should feel immediate even if the Stripe transfer settles later
    // (user feedback: "payouts must feel instant").
    const lifetimeEarningsCents = payouts.reduce((sum, p) => sum + p.amount, 0);
    const currentBalanceCents = payouts
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingPayoutsCents = payouts
      .filter((p) => p.status === "pending" || p.status === "processing")
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      currentBalanceCents,
      lifetimeEarningsCents,
      pendingPayoutsCents,
      payoutHistory: payouts.map((p) => ({
        id: p.id,
        type: p.type,
        amount: p.amount,
        status: p.status,
        challengeName: p.challenge.title,
        createdAt: p.createdAt.toISOString(),
        paidAt: p.paidAt?.toISOString() ?? null,
      })),
    };
  }
}
