import { computeFundingBreakdown, netPlatformTake } from "./pricing";

describe("computeFundingBreakdown", () => {
  it("matches the worked $5,000 example from README/ADR-005", () => {
    const breakdown = computeFundingBreakdown(500_000, 2000); // $5,000 pool, 20% take rate

    expect(breakdown.stipendPool).toBe(60_000); // $600 = 12% of pool, i.e. $150 x 4
    expect(breakdown.survivorBonusPool).toBe(30_000); // $300 = 6% of pool
    expect(breakdown.crowdFavourite).toBe(25_000); // $250 = 5% of pool
    expect(breakdown.platformFeeBase).toBe(590_000); // pool + stipend + survivor bonus
    expect(breakdown.platformFee).toBe(118_000); // $1,180
    expect(breakdown.totalCharge).toBe(708_000);
  });

  it("floors the crowd favourite at $50 for small pools", () => {
    const breakdown = computeFundingBreakdown(90_000, 2000); // $900 pool
    expect(breakdown.crowdFavourite).toBe(5_000); // 5% of $900 is $45, floor wins
  });

  it("never produces a negative net platform take across the $900-$10,000 range", () => {
    for (const prizePool of [90_000, 150_000, 500_000, 1_000_000]) {
      const breakdown = computeFundingBreakdown(prizePool, 2000);
      expect(netPlatformTake(breakdown)).toBeGreaterThanOrEqual(0);
    }
  });

  it("rejects a non-positive prize pool", () => {
    expect(() => computeFundingBreakdown(0, 2000)).toThrow();
    expect(() => computeFundingBreakdown(-100, 2000)).toThrow();
  });

  it("honors a seller-overridden stipend pool instead of the 12% default", () => {
    const breakdown = computeFundingBreakdown(500_000, 2000, 100_000);
    expect(breakdown.stipendPool).toBe(100_000);
  });
});
