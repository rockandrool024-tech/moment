import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../common/prisma/prisma.service";
import { PayoutsService } from "../payments/payouts.service";

// Platform-funded, like crowd_favourite — never paid from a challenge's own
// escrow, since a referral has nothing to do with any one campaign.
const REFERRAL_BONUS_CENTS = 500; // $5

export interface ReferralStats {
  totalReferred: number;
  totalRewardedCents: number;
  pendingCount: number;
}

// Loop 3 (growth-viral-mechanics.md): "reward the action, not the signup" —
// a ReferralReward row is created (status: pending) the moment a referred
// user signs up, but only pays out once that user actually does something
// (first submission or first vote, whichever comes first). Reuses the same
// User.referralCode already serving rally links (ADR-002) — one personal
// code, two different consumers.
@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payouts: PayoutsService,
  ) {}

  /** Called right after a brand-new account is created, if a referral code was supplied. */
  async attributeSignup(refereeId: string, referralCode: string): Promise<void> {
    const referrer = await this.prisma.user.findUnique({ where: { referralCode } });
    if (!referrer || referrer.id === refereeId) return; // unknown/self-referral — silently no-op

    try {
      await this.prisma.referralReward.create({
        data: { referrerId: referrer.id, refereeId },
      });
    } catch {
      // refereeId is @unique — a user can only ever be referred once. A
      // retry of the verify call (e.g. a flaky network) hits this and
      // should just no-op, not error the login.
    }
  }

  /**
   * Called after the referred user's first submission or first vote —
   * whichever fires first wins the atomic claim below, so a user who both
   * submits and votes only ever triggers one payout.
   */
  async rewardIfPending(
    refereeId: string,
    challengeId: string,
    triggeredBy: "first_submission" | "first_vote",
  ): Promise<void> {
    const claim = await this.prisma.referralReward.updateMany({
      where: { refereeId, status: "pending" },
      data: {
        status: "rewarded",
        rewardedAt: new Date(),
        rewardAmountCents: REFERRAL_BONUS_CENTS,
        triggeredBy,
      },
    });
    if (claim.count === 0) return; // not referred, or already rewarded

    const reward = await this.prisma.referralReward.findUniqueOrThrow({ where: { refereeId } });
    try {
      await this.payouts.batchCreateAndTransfer(
        challengeId,
        [{ userId: reward.referrerId, type: "referral_bonus", amount: REFERRAL_BONUS_CENTS }],
        new Date(),
      );
    } catch (error) {
      this.logger.error(`Referral payout failed for reward ${reward.id}`, error as Error);
    }
  }

  async getStats(userId: string): Promise<ReferralStats> {
    const [totalReferred, rewardedAgg, pendingCount] = await Promise.all([
      this.prisma.referralReward.count({ where: { referrerId: userId } }),
      this.prisma.referralReward.aggregate({
        where: { referrerId: userId, status: "rewarded" },
        _sum: { rewardAmountCents: true },
      }),
      this.prisma.referralReward.count({ where: { referrerId: userId, status: "pending" } }),
    ]);
    return {
      totalReferred,
      totalRewardedCents: rewardedAgg._sum.rewardAmountCents ?? 0,
      pendingCount,
    };
  }
}
