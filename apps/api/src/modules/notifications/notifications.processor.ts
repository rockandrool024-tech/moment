import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { NotificationEvent } from "./notifications.service";

// No delivery channel wired up yet (FCM/APNs/email/SMS is production-scope
// follow-on work) — this just proves the queue path end-to-end and gives
// later work a single place to plug in a real sender.
@Processor("notifications")
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<NotificationEvent>): Promise<void> {
    this.logger.log(`[stub] would deliver notification: ${JSON.stringify(job.data)}`);
  }
}
