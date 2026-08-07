// Mirrors User.tier (Int 0-3) — see apps/api's computeTier (rounds/tier.ts, sprint 2).
const TIER_LABELS = ["Bronze", "Silver", "Gold", "Platinum"];

export function tierLabel(tier: number): string {
  return TIER_LABELS[tier] ?? TIER_LABELS[0];
}
