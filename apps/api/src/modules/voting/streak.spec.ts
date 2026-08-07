import { applyVote, daysBetween, reconcile, StreakState } from "./streak";

const day = (n: number) => new Date(2026, 0, n);

describe("applyVote", () => {
  it("starts a brand-new streak at 1", () => {
    const state: StreakState = { streakCount: 0, lastVoteDate: null, streakPausedReason: null };
    expect(applyVote(state, day(1))).toMatchObject({ streakCount: 1, streakPausedReason: null });
  });

  it("does not double-count a second vote the same day", () => {
    const state: StreakState = { streakCount: 3, lastVoteDate: day(1), streakPausedReason: null };
    expect(applyVote(state, day(1))).toMatchObject({ streakCount: 3 });
  });

  it("extends the streak on a consecutive day", () => {
    const state: StreakState = { streakCount: 3, lastVoteDate: day(1), streakPausedReason: null };
    expect(applyVote(state, day(2))).toMatchObject({ streakCount: 4 });
  });

  it("resets to 1 on a real gap (not paused)", () => {
    const state: StreakState = { streakCount: 5, lastVoteDate: day(1), streakPausedReason: null };
    expect(applyVote(state, day(5))).toMatchObject({ streakCount: 1 });
  });

  it("resumes (does not reset) a paused streak regardless of gap length", () => {
    const state: StreakState = {
      streakCount: 7,
      lastVoteDate: day(1),
      streakPausedReason: "no_eligible_content",
    };
    expect(applyVote(state, day(10))).toMatchObject({ streakCount: 8, streakPausedReason: null });
  });

  it("clears any pause reason on a fresh vote", () => {
    const state: StreakState = { streakCount: 1, lastVoteDate: day(1), streakPausedReason: "no_eligible_content" };
    expect(applyVote(state, day(2)).streakPausedReason).toBeNull();
  });
});

describe("reconcile", () => {
  it("does nothing for a user who has never voted", () => {
    const state: StreakState = { streakCount: 0, lastVoteDate: null, streakPausedReason: null };
    expect(reconcile(state, day(10), true)).toEqual({ action: "none" });
  });

  it("does nothing within the same-day/next-day grace window", () => {
    const state: StreakState = { streakCount: 2, lastVoteDate: day(1), streakPausedReason: null };
    expect(reconcile(state, day(2), true)).toEqual({ action: "none" });
  });

  it("resets when content existed but the user just did not vote", () => {
    const state: StreakState = { streakCount: 4, lastVoteDate: day(1), streakPausedReason: null };
    expect(reconcile(state, day(4), true)).toEqual({ action: "reset" });
  });

  it("pauses (not resets) when no eligible content existed in the gap", () => {
    const state: StreakState = { streakCount: 4, lastVoteDate: day(1), streakPausedReason: null };
    expect(reconcile(state, day(4), false)).toEqual({
      action: "pause",
      reason: "no_eligible_content",
    });
  });

  it("leaves an already-paused streak alone until a real vote resumes it", () => {
    const state: StreakState = {
      streakCount: 4,
      lastVoteDate: day(1),
      streakPausedReason: "no_eligible_content",
    };
    expect(reconcile(state, day(20), true)).toEqual({ action: "none" });
  });
});

describe("daysBetween", () => {
  it("counts whole calendar days regardless of time-of-day", () => {
    const morning = new Date(2026, 0, 1, 6, 0, 0);
    const night = new Date(2026, 0, 3, 23, 30, 0);
    expect(daysBetween(morning, night)).toBe(2);
  });
});
