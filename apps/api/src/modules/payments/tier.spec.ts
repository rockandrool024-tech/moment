import { computeTier, TIER_BRONZE, TIER_GOLD, TIER_PLATINUM, TIER_SILVER } from "./tier";

describe("computeTier", () => {
  it("starts everyone at bronze", () => {
    expect(computeTier(0, 0)).toBe(TIER_BRONZE);
  });

  it("promotes to silver on either earnings or a first win", () => {
    expect(computeTier(10_000, 0)).toBe(TIER_SILVER);
    expect(computeTier(0, 1)).toBe(TIER_SILVER);
    expect(computeTier(9_999, 0)).toBe(TIER_BRONZE);
  });

  it("promotes to gold on either threshold", () => {
    expect(computeTier(100_000, 0)).toBe(TIER_GOLD);
    expect(computeTier(0, 3)).toBe(TIER_GOLD);
    expect(computeTier(99_999, 2)).toBe(TIER_SILVER);
  });

  it("promotes to platinum on either threshold", () => {
    expect(computeTier(500_000, 0)).toBe(TIER_PLATINUM);
    expect(computeTier(0, 10)).toBe(TIER_PLATINUM);
  });

  it("a single big win can outrun a slow earnings climb", () => {
    // Many small stipends short of $100 total, but 1 outright win still counts.
    expect(computeTier(5_000, 1)).toBe(TIER_SILVER);
  });

  it("never regresses below bronze or exceeds platinum for extreme inputs", () => {
    expect(computeTier(0, 0)).toBeGreaterThanOrEqual(TIER_BRONZE);
    expect(computeTier(10_000_000, 1000)).toBe(TIER_PLATINUM);
  });
});
