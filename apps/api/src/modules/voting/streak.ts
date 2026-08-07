// Pure date logic for voting streaks (growth-viral-mechanics.md §5,
// ADR-005 §5) — kept dependency-free and unit-testable, same rationale as
// scoring.ts and pricing.ts.

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / MS_PER_DAY);
}

export interface StreakState {
  streakCount: number;
  lastVoteDate: Date | null;
  streakPausedReason: string | null;
}

export interface StreakUpdate {
  streakCount: number;
  lastVoteDate: Date;
  streakPausedReason: null;
  changed: true;
}

/**
 * Casting a vote always resumes/extends/starts the streak, regardless of
 * pause state — voting is what streaks measure, so an actual vote fixes
 * everything. Consecutive-day votes extend the count; a gap (paused or not)
 * restarts at 1 rather than compounding a broken streak.
 */
export function applyVote(state: StreakState, now: Date): StreakUpdate {
  const today = startOfDay(now);

  if (state.lastVoteDate && daysBetween(state.lastVoteDate, today) === 0) {
    // Already voted today — streak for today is already counted.
    return {
      streakCount: state.streakCount,
      lastVoteDate: state.lastVoteDate,
      streakPausedReason: null,
      changed: true,
    };
  }

  const isConsecutive = state.lastVoteDate && daysBetween(state.lastVoteDate, today) === 1;
  const wasPaused = state.streakPausedReason !== null;
  const extending = isConsecutive || wasPaused;

  return {
    streakCount: extending ? state.streakCount + 1 : 1,
    lastVoteDate: now,
    streakPausedReason: null,
    changed: true,
  };
}

export type ReconcileResult =
  | { action: "none" }
  | { action: "reset" }
  | { action: "pause"; reason: string };

/**
 * Read-time (non-voting) reconciliation: did the gap since the last vote
 * cross a full missed day, and if so, was there actually something to vote
 * on? No eligible content pauses the streak (ADR-005 §5: "a streak broken
 * by your own thin marketplace is worse than no streak"); real inactivity
 * resets it.
 */
export function reconcile(state: StreakState, now: Date, hadEligibleContentInGap: boolean): ReconcileResult {
  if (!state.lastVoteDate) return { action: "none" };

  const today = startOfDay(now);
  const gapDays = daysBetween(state.lastVoteDate, today);

  if (gapDays <= 1) return { action: "none" }; // same day or still within the grace window
  if (state.streakPausedReason) return { action: "none" }; // already paused, waiting on a vote to resume

  return hadEligibleContentInGap ? { action: "reset" } : { action: "pause", reason: "no_eligible_content" };
}
