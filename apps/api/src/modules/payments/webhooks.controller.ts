import { BadRequestException, Controller, Headers, Logger, Post, RawBodyRequest, Req } from "@nestjs/common";
import type { Request } from "express";
import Stripe from "stripe";
import { PrismaService } from "../../common/prisma/prisma.service";
import { StripeService } from "./stripe.service";
import { FundingService } from "./funding.service";
import { PayoutsService } from "./payouts.service";

@Controller("payments/webhooks")
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripe: StripeService,
    private readonly funding: FundingService,
    private readonly payouts: PayoutsService,
  ) {}

  @Post("stripe")
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
  ): Promise<{ received: true }> {
    if (!signature) {
      throw new BadRequestException("Missing stripe-signature header");
    }
    if (!req.rawBody) {
      throw new BadRequestException("Raw body unavailable for signature verification");
    }

    let event: Stripe.Event;
    try {
      event = this.stripe
        .get()
        .webhooks.constructEvent(req.rawBody, signature, this.stripe.getWebhookSecret());
    } catch (err) {
      this.logger.warn(`Stripe webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException("Invalid webhook signature");
    }

    const alreadyProcessed = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: "stripe", eventId: event.id } },
    });
    if (alreadyProcessed) {
      return { received: true };
    }

    await this.dispatch(event);

    await this.prisma.webhookEvent.create({
      data: { provider: "stripe", eventId: event.id },
    });

    return { received: true };
  }

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const intent = event.data.object as Stripe.PaymentIntent;
        const challengeId = intent.metadata?.challengeId;
        if (challengeId) {
          await this.funding.markFunded(challengeId);
        }
        break;
      }
      case "transfer.created": {
        const transfer = event.data.object as Stripe.Transfer;
        const payoutId = transfer.metadata?.payoutId;
        if (payoutId) {
          await this.payouts.markPaid(payoutId);
        }
        break;
      }
      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  }
}
