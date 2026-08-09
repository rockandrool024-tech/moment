import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { Notification, NotificationType, Prisma } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";

export type NotificationEvent =
  | { type: "round_revealed"; userId: string; roundId: string }
  | { type: "submission_eliminated"; userId: string; submissionId: string }
  | { type: "payout_paid"; userId: string; payoutId: string }
  | { type: "challenge_invite"; userId: string; challengeId: string; invitedBy: string };

// Queue-backed: enqueue() just schedules the job; NotificationsProcessor is
// what actually writes the Notification row a real inbox reads from — kept
// as two steps so a slow/failed write never blocks the caller (a vote cast,
// a payout batch) that triggered it.
@Injectable()
export class NotificationsService {
  constructor(
    @InjectQueue("notifications") private readonly queue: Queue<NotificationEvent>,
    private readonly prisma: PrismaService,
  ) {}

  async enqueue(event: NotificationEvent): Promise<void> {
    await this.queue.add(event.type, event);
  }

  async list(userId: string, limit = 50): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: string, userId: string): Promise<void> {
    // Scoped by userId, not just id — a notification's owner is the only
    // one who can mark it read, same posture as every other "mine" mutation.
    await this.prisma.notification.updateMany({
      where: { id, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  /** Called by NotificationsProcessor once it's built real copy for an event. */
  record(userId: string, type: NotificationType, title: string, body: string, data?: Prisma.InputJsonValue): Promise<Notification> {
    return this.prisma.notification.create({ data: { userId, type, title, body, data } });
  }
}
