// Creator tiers (growth-viral-mechanics.md §4: "Bronze → Silver → Gold →
// Platinum unlock actual things"). Pure function, unit-tested like
// pricing.ts — a creator qualifies by lifetime earnings OR win count,
// whichever they hit first, since a single big win and many small stipends
// should both be able to earn status.
//
// Stored as User.tier (Int 0-3). Thresholds are a v1 placeholder, same
// caveat as the ADR-005 non-participation penalty — tune once there's real
// earnings-distribution data, not a launch-day constant to treat as final.
export const TIER_BRONZE = 0;
export const TIER_SILVER = 1;
export const TIER_GOLD = 2;
export const TIER_PLATINUM = 3;

const SILVER_EARNINGS_CENTS = 10_000; // $100
const GOLD_EARNINGS_CENTS = 100_000; // $1,000
const PLATINUM_EARNINGS_CENTS = 500_000; // $5,000

export function computeTier(lifetimeEarningsCents: number, wins: number): number {
  if (lifetimeEarningsCents >= PLATINUM_EARNINGS_CENTS || wins >= 10) return TIER_PLATINUM;
  if (lifetimeEarningsCents >= GOLD_EARNINGS_CENTS || wins >= 3) return TIER_GOLD;
  if (lifetimeEarningsCents >= SILVER_EARNINGS_CENTS || wins >= 1) return TIER_SILVER;
  return TIER_BRONZE;
}
