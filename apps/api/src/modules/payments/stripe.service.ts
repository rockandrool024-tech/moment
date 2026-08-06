import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

// Thin wrapper around the Stripe SDK, constructed lazily so the app boots
// without a live STRIPE_SECRET_KEY — calls only fail once something actually
// tries to move money, per the "stub with env-var config" decision.
@Injectable()
export class StripeService {
  private client: Stripe | undefined;

  constructor(private readonly config: ConfigService) {}

  get(): Stripe {
    if (this.client) return this.client;

    const secretKey = this.config.get<string>("stripe.secretKey");
    if (!secretKey) {
      throw new InternalServerErrorException(
        "Payments are not configured (STRIPE_SECRET_KEY missing)",
      );
    }

    this.client = new Stripe(secretKey, { apiVersion: "2025-02-24.acacia" });
    return this.client;
  }

  getWebhookSecret(): string {
    const secret = this.config.get<string>("stripe.webhookSecret");
    if (!secret) {
      throw new InternalServerErrorException(
        "Stripe webhook secret is not configured (STRIPE_WEBHOOK_SECRET missing)",
      );
    }
    return secret;
  }
}
