import { BadRequestException, Controller, Headers, Logger, Post, RawBodyRequest, Req } from "@nestjs/common";
import type { Request } from "express";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CryptoService } from "./crypto.service";
import { CoinsService } from "./coins.service";

interface CoinbaseWebhookEvent {
  id: string;
  type: string; // "charge:confirmed" | "charge:failed" | "charge:pending" | ...
  data: { id: string };
}

@Controller("payments/webhooks")
export class CoinbaseWebhooksController {
  private readonly logger = new Logger(CoinbaseWebhooksController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly coins: CoinsService,
  ) {}

  @Post("coinbase")
  async handleCoinbaseWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-cc-webhook-signature") signature: string | undefined,
  ): Promise<{ received: true }> {
    if (!req.rawBody) {
      throw new BadRequestException("Raw body unavailable for signature verification");
    }
    const rawBody = req.rawBody.toString("utf8");
    if (!this.crypto.verifyWebhookSignature(rawBody, signature)) {
      this.logger.warn("Coinbase Commerce webhook signature verification failed");
      throw new BadRequestException("Invalid webhook signature");
    }

    const event = JSON.parse(rawBody) as { event: CoinbaseWebhookEvent };
    const { id: eventId, type, data } = event.event;

    const alreadyProcessed = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: "coinbase_commerce", eventId } },
    });
    if (alreadyProcessed) return { received: true };

    switch (type) {
      case "charge:confirmed":
        await this.coins.markCompleted(data.id);
        break;
      case "charge:failed":
      case "charge:delayed":
        await this.coins.markExpired(data.id);
        break;
      default:
        this.logger.debug(`Unhandled Coinbase Commerce event type: ${type}`);
    }

    await this.prisma.webhookEvent.create({ data: { provider: "coinbase_commerce", eventId } });
    return { received: true };
  }
}
