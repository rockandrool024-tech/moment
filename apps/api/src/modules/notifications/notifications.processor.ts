import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { Notification } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { NotificationEvent, NotificationsService } from "./notifications.service";
import { PushService } from "./push.service";

// Notification copy is the only place apps/api ever renders money as text
// (everywhere else returns raw cents for the client to format) — kept
// local rather than a shared util for that one reason.
function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Plain text — no emoji. The client renders a real icon keyed off the
// Notification.type / data.payoutType fields instead (see
// apps/web/src/app/notifications/page.tsx), same icon-rollout posture as
// the rest of the app (replaced emoji/text across nav/streak/KYB/wallet).
const PAYOUT_COPY: Record<string, { label: string }> = {
  winner: { label: "You won" },
  stipend: { label: "Stipend paid" },
  survivor_bonus: { label: "Survivor bonus" },
  crowd_favourite: { label: "Crowd favourite bonus" },
  referral_bonus: { label: "Referral bonus" },
};

// Writes the real Notification row an inbox reads from (GET /notifications),
// then best-effort delivers a real Web Push (VAPID) notification via
// PushService — no FCM/Twilio/SES account needed for that part.
@Processor("notifications")
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(
    private readonly notifications: NotificationsService,
    private readonly prisma: PrismaService,
    private readonly push: PushService,
  ) {
    super();
  }

  // Best-effort, fire-and-forget from the caller's perspective — PushService
  // already swallows per-subscription failures, so this never blocks the
  // in-app inbox row (already written by the time this runs) on delivery.
  private notifyPush(userId: string, notification: Notification): void {
    void this.push.sendToUser(userId, { title: notification.title, body: notification.body });
  }

  async process(job: Job<NotificationEvent>): Promise<void> {
    const event = job.data;
    try {
      switch (event.type) {
        case "payout_paid":
          await this.handlePayout(event.userId, event.payoutId);
          break;
        case "round_revealed":
          await this.handleRoundRevealed(event.userId, event.roundId);
          break;
        case "challenge_invite":
          await this.handleChallengeInvite(event.userId, event.challengeId);
          break;
        case "submission_eliminated": {
          const n = await this.notifications.record(
            event.userId,
            "round_result",
            "Entry not advanced",
            "Your entry didn't make it through this round — check the challenge for what's next.",
            { submissionId: event.submissionId },
          );
          this.notifyPush(event.userId, n);
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Failed to record notification for ${event.type}`, error as Error);
    }
  }

  private async handlePayout(userId: string, payoutId: string): Promise<void> {
    const payout = await this.prisma.payout.findUnique({
      where: { id: payoutId },
      include: { challenge: { select: { title: true } } },
    });
    if (!payout) return;

    const copy = PAYOUT_COPY[payout.type] ?? { label: "Payout" };
    const n = await this.notifications.record(
      userId,
      "payout",
      `${copy.label}: ${formatCents(payout.amount)}`,
      `${payout.challenge.title} — ${formatCents(payout.amount)} is on its way to your linked Stripe account.`,
      { payoutId, amount: payout.amount, payoutType: payout.type },
    );
    this.notifyPush(userId, n);
  }

  private async handleRoundRevealed(userId: string, roundId: string): Promise<void> {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: { challenge: { select: { title: true } } },
    });
    if (!round) return;

    const n = await this.notifications.record(
      userId,
      "round_result",
      `Round ${round.roundNumber} revealed`,
      `Results are in for "${round.challenge.title}" — round ${round.roundNumber}.`,
      { roundId, challengeId: round.challengeId },
    );
    this.notifyPush(userId, n);
  }

  private async handleChallengeInvite(userId: string, challengeId: string): Promise<void> {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { title: true },
    });
    if (!challenge) return;

    const n = await this.notifications.record(
      userId,
      "challenge_invite",
      "You're invited to a challenge",
      `A brand invited you to compete in "${challenge.title}".`,
      { challengeId },
    );
    this.notifyPush(userId, n);
  }
}
