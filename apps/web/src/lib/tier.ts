// Mirrors User.tier (Int 0-3) — see apps/api's computeTier (rounds/tier.ts, sprint 2).
const TIER_LABELS = ["Bronze", "Silver", "Gold", "Platinum"];

export function tierLabel(tier: number): string {
  return TIER_LABELS[tier] ?? TIER_LABELS[0];
}

/** CSS var reference for the shared tier color scale (globals.css --tier-0..3). */
export function tierColorVar(tier: number): string {
  return `var(--tier-${Math.min(Math.max(tier, 0), 3)})`;
}

/** Spread onto a `.badge.badge-tier` element's style prop (cast to
 * React.CSSProperties at the call site — TS doesn't type custom props). */
export function tierBadgeStyle(tier: number): Record<string, string> {
  return { "--tier-color": tierColorVar(tier) };
}
