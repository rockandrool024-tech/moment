import { Injectable, Logger } from "@nestjs/common";
import { PayoutType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StripeService } from "./stripe.service";
import { computeTier } from "./tier";
import { NotificationsService } from "../notifications/notifications.service";

export interface PayoutEntry {
  userId: string;
  type: PayoutType;
  amount: number;
}

// Days after final-round reveal a payout is expected to clear. On-time
// payout rate (ADR-004) is computed against this, never app-side state.
const PAYOUT_DUE_DAYS = 7;

// Payouts are batched at round-reveal time rather than fired one at a time
// (ADR-005 consequence: "more Stripe transfers per campaign — batch them at
// round close rather than firing individually").
@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly notifications: NotificationsService,
  ) {}

  async batchCreateAndTransfer(
    challengeId: string,
    entries: PayoutEntry[],
    finalRoundRevealedAt: Date,
  ): Promise<void> {
    const payoutDueAt = new Date(
      finalRoundRevealedAt.getTime() + PAYOUT_DUE_DAYS * 24 * 60 * 60 * 1000,
    );

    const payouts = await this.prisma.$transaction(
      entries.map((entry) =>
        this.prisma.payout.create({
          data: {
            challengeId,
            userId: entry.userId,
            type: entry.type,
            amount: entry.amount,
            status: "pending",
            payoutDueAt,
          },
        }),
      ),
    );

    for (const payout of payouts) {
      await this.transferOne(payout.id);
    }

    // Notified at creation, not at the markPaid webhook — same "earned the
    // moment it's owed" posture as the wallet page (wallet.service.ts).
    await Promise.all(
      payouts.map((payout) =>
        this.notifications.enqueue({ type: "payout_paid", userId: payout.userId, payoutId: payout.id }),
      ),
    );

    const recipientIds = [...new Set(payouts.map((p) => p.userId))];
    await Promise.all(recipientIds.map((userId) => this.recomputeEarningsAndTier(userId)));
  }

  /**
   * Lifetime earnings + tier (growth-viral-mechanics.md §4), recomputed
   * whenever a payout is created — "earned" the moment it's owed, same as
   * the wallet page's own definition, not gated on Stripe actually settling.
   */
  private async recomputeEarningsAndTier(userId: string): Promise<void> {
    const [earningsAgg, wins] = await Promise.all([
      this.prisma.payout.aggregate({ where: { userId }, _sum: { amount: true } }),
      this.prisma.payout.count({ where: { userId, type: "winner" } }),
    ]);
    const lifetimeEarnings = earningsAgg._sum.amount ?? 0;

    await this.prisma.user.update({
      where: { id: userId },
      data: { lifetimeEarnings, tier: computeTier(lifetimeEarnings, wins) },
    });
  }

  private async transferOne(payoutId: string): Promise<void> {
    const payout = await this.prisma.payout.findUniqueOrThrow({
      where: { id: payoutId },
      include: { user: true },
    });

    if (!payout.user.stripeConnectAccountId) {
      this.logger.warn(
        `Payout ${payoutId} owed to ${payout.userId} but they have no Stripe Connect account yet — left pending`,
      );
      return;
    }

    await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: "processing" },
    });

    try {
      // idempotencyKey keyed on the Payout row's own (stable, pre-created)
      // id — a retry of this exact payout after a crash/timeout replays the
      // same Stripe request instead of sending a second real transfer.
      const transfer = await this.stripe.get().transfers.create(
        {
          amount: payout.amount,
          currency: "usd",
          destination: payout.user.stripeConnectAccountId,
          metadata: { payoutId: payout.id, challengeId: payout.challengeId },
        },
        { idempotencyKey: `payout:${payout.id}` },
      );

      await this.prisma.payout.update({
        where: { id: payoutId },
        data: { stripeTransferId: transfer.id },
      });
    } catch (error) {
      this.logger.error(`Transfer failed for payout ${payoutId}`, error as Error);
      await this.prisma.payout.update({
        where: { id: payoutId },
        data: { status: "failed" },
      });
    }
  }

  /** Called from the Stripe webhook once the transfer is confirmed. */
  async markPaid(payoutId: string): Promise<void> {
    await this.prisma.payout.update({
      where: { id: payoutId },
      data: { status: "paid", paidAt: new Date() },
    });
  }

  async findByStripeTransferId(transferId: string) {
    return this.prisma.payout.findFirst({ where: { stripeTransferId: transferId } });
  }
}
