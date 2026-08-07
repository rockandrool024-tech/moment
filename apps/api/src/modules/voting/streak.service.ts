import { Injectable } from "@nestjs/common";
import { User } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { applyVote, reconcile, StreakState } from "./streak";

export interface StreakSummary {
  streakCount: number;
  lastVoteDate: Date | null;
  streakPausedReason: string | null;
}

@Injectable()
export class StreakService {
  constructor(private readonly prisma: PrismaService) {}

  /** Called after a vote (peer or public) is successfully recorded. */
  async applyVoteForUser(userId: string, now: Date = new Date()): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const update = applyVote(toState(user), now);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        streakCount: update.streakCount,
        lastVoteDate: update.lastVoteDate,
        streakPausedReason: update.streakPausedReason,
      },
    });
  }

  /**
   * Read-time reconciliation for GET /users/me/streak — decides whether a
   * gap since the last vote should pause (no content was available) or
   * reset (content existed, the user just didn't vote) the streak. This is
   * the only place the "pause not break" rule can apply, since it depends
   * on content that only exists in the gap window, not at vote time.
   */
  async getStreak(userId: string, now: Date = new Date()): Promise<StreakSummary> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const state = toState(user);
    const result = reconcile(state, now, await this.hadEligibleContentSince(user));

    if (result.action === "none") return state;

    const streakPausedReason = result.action === "pause" ? result.reason : null;
    const streakCount = result.action === "reset" ? 0 : state.streakCount;

    await this.prisma.user.update({
      where: { id: userId },
      data: { streakCount, streakPausedReason },
    });

    return { streakCount, lastVoteDate: state.lastVoteDate, streakPausedReason };
  }

  private async hadEligibleContentSince(user: User): Promise<boolean> {
    if (!user.lastVoteDate) return false;
    const count = await this.prisma.round.count({
      where: {
        status: { in: ["open", "closed", "tallied", "revealed"] },
        opensAt: { gt: user.lastVoteDate },
      },
    });
    return count > 0;
  }
}

function toState(user: User): StreakState {
  return {
    streakCount: user.streakCount,
    lastVoteDate: user.lastVoteDate,
    streakPausedReason: user.streakPausedReason,
  };
}
