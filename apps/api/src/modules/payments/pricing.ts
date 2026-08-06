// Prize-pool economics, straight out of README §Economics and ADR-005 §3.
// All amounts are minor units (cents). Kept as pure functions — this is the
// other piece of logic (alongside the round state machine) worth getting
// exactly right, since a rounding bug here is a wrong wire transfer, not a
// wrong pixel.

export interface FundingBreakdown {
  prizePool: number;
  stipendPool: number;
  survivorBonusPool: number;
  platformFeeBase: number;
  platformFee: number;
  totalCharge: number;
  crowdFavourite: number;
}

const STIPEND_RATE = 0.12; // 12% of pool, split across finalists
const SURVIVOR_BONUS_RATE = 0.06; // 6% of pool, split across round-2 survivors
const CROWD_FAVOURITE_RATE = 0.05; // 5% of pool, platform-funded
const CROWD_FAVOURITE_FLOOR_CENTS = 5000; // $50 floor per ADR-005

/**
 * Computes what the seller is charged at funding time. Stipend pool may be
 * seller-overridden by the campaign wizard (not built this phase); when
 * omitted it defaults to the standard 12% rate.
 *
 * Platform fee is 20% (configurable via takeRateBps) of (prize + stipend +
 * survivor bonus) — charged on top of the pool, per ADR-002/ADR-005. Crowd
 * favourite is NOT billed to the seller: it's paid out of the platform fee,
 * which is why net take (~10.2%) is meaningfully lower than the gross 20%
 * headline rate.
 */
export function computeFundingBreakdown(
  prizePool: number,
  takeRateBps: number,
  stipendPoolOverride?: number,
): FundingBreakdown {
  if (prizePool <= 0) {
    throw new Error("prizePool must be positive");
  }

  const stipendPool = stipendPoolOverride ?? Math.round(prizePool * STIPEND_RATE);
  const survivorBonusPool = Math.round(prizePool * SURVIVOR_BONUS_RATE);
  const platformFeeBase = prizePool + stipendPool + survivorBonusPool;
  const platformFee = Math.round((platformFeeBase * takeRateBps) / 10000);
  const totalCharge = platformFeeBase + platformFee;
  const crowdFavourite = Math.max(
    Math.round(prizePool * CROWD_FAVOURITE_RATE),
    CROWD_FAVOURITE_FLOOR_CENTS,
  );

  return {
    prizePool,
    stipendPool,
    survivorBonusPool,
    platformFeeBase,
    platformFee,
    totalCharge,
    crowdFavourite,
  };
}

/** Net platform take after paying the crowd favourite out of the fee (pre-Stripe-processing). */
export function netPlatformTake(breakdown: FundingBreakdown): number {
  return breakdown.platformFee - breakdown.crowdFavourite;
}
