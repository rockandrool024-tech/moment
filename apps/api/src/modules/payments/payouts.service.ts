import { Injectable, Logger } from "@nestjs/common";
import { PayoutType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StripeService } from "./stripe.service";

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
      const transfer = await this.stripe.get().transfers.create({
        amount: payout.amount,
        currency: "usd",
        destination: payout.user.stripeConnectAccountId,
        metadata: { payoutId: payout.id, challengeId: payout.challengeId },
      });

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
