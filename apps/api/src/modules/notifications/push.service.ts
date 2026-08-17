import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as webpush from "web-push";
import { PrismaService } from "../../common/prisma/prisma.service";

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

// Real delivery via VAPID — no FCM/APNs account needed. Configured lazily,
// same "boots without it, throws only when actually sending" posture as
// StripeService: a missing VAPID key never blocks app startup, only a
// push send.
@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private configured = false;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  private ensureConfigured(): boolean {
    if (this.configured) return true;
    const publicKey = this.config.get<string>("vapid.publicKey");
    const privateKey = this.config.get<string>("vapid.privateKey");
    const subject = this.config.get<string>("vapid.subject");
    if (!publicKey || !privateKey || !subject) return false;

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.configured = true;
    return true;
  }

  subscribe(userId: string, sub: PushSubscriptionInput): Promise<void> {
    return this.prisma.pushSubscription
      .upsert({
        where: { endpoint: sub.endpoint },
        create: {
          userId,
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          userAgent: sub.userAgent,
        },
        update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth, userAgent: sub.userAgent },
      })
      .then(() => undefined);
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
  }

  // Best-effort: a push failure never throws back to the caller (the
  // notification job that triggered this) — the in-app inbox row already
  // exists regardless of whether push delivery succeeds.
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!this.ensureConfigured()) return;

    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } });
    if (subs.length === 0) return;

    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            body,
          );
        } catch (error) {
          const statusCode = (error as { statusCode?: number }).statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined);
            return;
          }
          this.logger.warn(`Push send failed for subscription ${sub.id}: ${(error as Error).message}`);
        }
      }),
    );
  }
}
