import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StripeService } from "./stripe.service";
import { computeFundingBreakdown, FundingBreakdown } from "./pricing";

export interface FundingResult {
  clientSecret: string;
  breakdown: FundingBreakdown;
}

@Injectable()
export class FundingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
  ) {}

  async fundChallenge(challengeId: string, sellerId: string): Promise<FundingResult> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException("Challenge not found");
    if (challenge.sellerId !== sellerId) {
      throw new ForbiddenException("Only the owning seller can fund this challenge");
    }
    if (challenge.status !== "draft") {
      throw new BadRequestException(`Challenge is already ${challenge.status}`);
    }

    const seller = await this.prisma.user.findUniqueOrThrow({ where: { id: sellerId } });
    if (!seller.kybVerified) {
      throw new ForbiddenException("KYB verification required to fund challenges");
    }

    const breakdown = computeFundingBreakdown(
      challenge.prizePool,
      challenge.takeRateBps,
      challenge.stipendPool || undefined,
    );

    const paymentIntent = await this.stripe.get().paymentIntents.create({
      amount: breakdown.totalCharge,
      currency: "usd",
      metadata: { challengeId },
      description: `MOMENT escrow funding — ${challenge.title}`,
    });

    await this.prisma.challenge.update({
      where: { id: challengeId },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stipendPool: breakdown.stipendPool,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new BadRequestException("Stripe did not return a client secret");
    }

    return { clientSecret: paymentIntent.client_secret, breakdown };
  }

  /** Called from the Stripe webhook once the funding PaymentIntent succeeds. */
  async markFunded(challengeId: string): Promise<void> {
    await this.prisma.challenge.updateMany({
      where: { id: challengeId, status: "draft" },
      data: { status: "funded" },
    });
  }
}
