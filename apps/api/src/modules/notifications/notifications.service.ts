import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

export type NotificationEvent =
  | { type: "round_revealed"; userId: string; roundId: string }
  | { type: "submission_eliminated"; userId: string; submissionId: string }
  | { type: "payout_paid"; userId: string; payoutId: string }
  | { type: "challenge_invite"; userId: string; challengeId: string; invitedBy: string };

// Queue-backed stub: enqueues the event so delivery channels (push/email/SMS
// per production-app-scope.md §Notifications) can be added later without
// touching any caller of this service.
@Injectable()
export class NotificationsService {
  constructor(@InjectQueue("notifications") private readonly queue: Queue<NotificationEvent>) {}

  async enqueue(event: NotificationEvent): Promise<void> {
    await this.queue.add(event.type, event);
  }
}
