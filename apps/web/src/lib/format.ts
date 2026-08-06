/** Renders minor-unit cents (see apps/api's Challenge/Payout amounts) as dollars. */
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

/** Converts a dollar-denominated form input back into minor-unit cents. */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}
