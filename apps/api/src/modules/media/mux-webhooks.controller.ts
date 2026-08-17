import { BadRequestException, Controller, Logger, Post, RawBodyRequest, Req } from "@nestjs/common";
import type { Request } from "express";
import type { UnwrapWebhookEvent } from "@mux/mux-node/resources/webhooks";
import { PrismaService } from "../../common/prisma/prisma.service";
import { MuxService } from "./mux.service";

@Controller("media/webhooks")
export class MuxWebhooksController {
  private readonly logger = new Logger(MuxWebhooksController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mux: MuxService,
  ) {}

  @Post("mux")
  async handleMuxWebhook(@Req() req: RawBodyRequest<Request>): Promise<{ received: true }> {
    if (!req.rawBody) throw new BadRequestException("Raw body unavailable for signature verification");

    let event: UnwrapWebhookEvent;
    try {
      event = this.mux
        .get()
        .webhooks.unwrap(req.rawBody.toString("utf8"), req.headers, this.mux.getWebhookSecret());
    } catch (err) {
      this.logger.warn(`Mux webhook signature verification failed: ${(err as Error).message}`);
      throw new BadRequestException("Invalid webhook signature");
    }

    const uploadId = "upload_id" in event.data ? event.data.upload_id : undefined;
    const eventId = `${event.type}:${event.data.id}:${uploadId ?? ""}`;
    const alreadyProcessed = await this.prisma.webhookEvent.findUnique({
      where: { provider_eventId: { provider: "mux", eventId } },
    });
    if (alreadyProcessed) return { received: true };

    await this.dispatch(event, uploadId);

    await this.prisma.webhookEvent.create({ data: { provider: "mux", eventId } });
    return { received: true };
  }

  private async dispatch(event: UnwrapWebhookEvent, uploadId: string | undefined): Promise<void> {
    switch (event.type) {
      case "video.asset.ready": {
        if (!uploadId) break;
        const playbackId = event.data.playback_ids?.[0]?.id;
        await this.prisma.submission.updateMany({
          where: { videoRef: uploadId },
          data: { videoRef: event.data.id, playbackId, videoStatus: "ready" },
        });
        break;
      }
      case "video.asset.errored": {
        if (!uploadId) break;
        await this.prisma.submission.updateMany({
          where: { videoRef: uploadId },
          data: { videoStatus: "errored" },
        });
        break;
      }
      default:
        this.logger.debug(`Unhandled Mux event type: ${event.type}`);
    }
  }
}
