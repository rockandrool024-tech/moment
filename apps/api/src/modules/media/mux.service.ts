import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Mux from "@mux/mux-node";

// Lazily-constructed Mux client, same "boot without keys, fail at call time"
// pattern as StripeService/OtpService.
@Injectable()
export class MuxService {
  private client: Mux | undefined;

  constructor(private readonly config: ConfigService) {}

  get(): Mux {
    if (this.client) return this.client;

    const tokenId = this.config.get<string>("mux.tokenId");
    const tokenSecret = this.config.get<string>("mux.tokenSecret");
    if (!tokenId || !tokenSecret) {
      throw new InternalServerErrorException(
        "Video upload is not configured (MUX_TOKEN_ID / MUX_TOKEN_SECRET missing)",
      );
    }

    this.client = new Mux({ tokenId, tokenSecret });
    return this.client;
  }

  getWebhookSecret(): string {
    const secret = this.config.get<string>("mux.webhookSecret");
    if (!secret) {
      throw new InternalServerErrorException(
        "Mux webhook secret is not configured (MUX_WEBHOOK_SECRET missing)",
      );
    }
    return secret;
  }
}
