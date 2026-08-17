import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "node:crypto";

const COINBASE_COMMERCE_API = "https://api.commerce.coinbase.com";
const API_VERSION = "2018-03-22";

export interface CoinbaseCharge {
  id: string;
  code: string;
  hosted_url: string;
}

// Thin wrapper around Coinbase Commerce's plain REST API — no SDK dependency
// (their Node SDK is a thin fetch wrapper anyway), constructed lazily so the
// app boots without a live COINBASE_COMMERCE_API_KEY, same "stub with
// env-var config" posture as StripeService/MuxService. Calls only fail once
// something actually tries to create a crypto charge.
@Injectable()
export class CryptoService {
  constructor(private readonly config: ConfigService) {}

  private getApiKey(): string {
    const apiKey = this.config.get<string>("coinbaseCommerce.apiKey");
    if (!apiKey) {
      throw new InternalServerErrorException(
        "Crypto payments are not configured (COINBASE_COMMERCE_API_KEY missing)",
      );
    }
    return apiKey;
  }

  getWebhookSecret(): string {
    const secret = this.config.get<string>("coinbaseCommerce.webhookSecret");
    if (!secret) {
      throw new InternalServerErrorException(
        "Coinbase Commerce webhook secret is not configured (COINBASE_COMMERCE_WEBHOOK_SECRET missing)",
      );
    }
    return secret;
  }

  async createCharge(params: {
    name: string;
    description: string;
    amountUsd: number; // major units, e.g. 5.00
    metadata: Record<string, string>;
    redirectUrl: string;
    cancelUrl: string;
  }): Promise<CoinbaseCharge> {
    const res = await fetch(`${COINBASE_COMMERCE_API}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": this.getApiKey(),
        "X-CC-Version": API_VERSION,
      },
      body: JSON.stringify({
        name: params.name,
        description: params.description,
        pricing_type: "fixed_price",
        local_price: { amount: params.amountUsd.toFixed(2), currency: "USD" },
        metadata: params.metadata,
        redirect_url: params.redirectUrl,
        cancel_url: params.cancelUrl,
      }),
    });

    if (!res.ok) {
      throw new InternalServerErrorException(`Coinbase Commerce charge creation failed: ${res.status}`);
    }

    const body = (await res.json()) as { data: CoinbaseCharge };
    return body.data;
  }

  /** Raw-body HMAC-SHA256 check — same shape as Stripe/Mux's own signature verification. */
  verifyWebhookSignature(rawBody: string, signatureHeader: string | undefined): boolean {
    if (!signatureHeader) return false;
    const expected = createHmac("sha256", this.getWebhookSecret()).update(rawBody).digest("hex");
    const expectedBuf = Buffer.from(expected, "hex");
    const actualBuf = Buffer.from(signatureHeader, "hex");
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  }
}
