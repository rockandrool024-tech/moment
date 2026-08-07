// Client-side preview of apps/api's computeFundingBreakdown (payments/pricing.ts)
// — same formulas, display-only. The authoritative numbers are computed
// server-side at funding time; this just lets the challenge page show
// survivor-bonus/crowd-favourite estimates before/without a funding call.
const STIPEND_RATE = 0.12;
const SURVIVOR_BONUS_RATE = 0.06;
const CROWD_FAVOURITE_RATE = 0.05;
const CROWD_FAVOURITE_FLOOR_CENTS = 5000;

export function previewSurvivorBonusPool(prizePool: number): number {
  return Math.round(prizePool * SURVIVOR_BONUS_RATE);
}

export function previewCrowdFavourite(prizePool: number): number {
  return Math.max(Math.round(prizePool * CROWD_FAVOURITE_RATE), CROWD_FAVOURITE_FLOOR_CENTS);
}

export function previewStipendPool(prizePool: number): number {
  return Math.round(prizePool * STIPEND_RATE);
}
