import { computeJourney, JourneyInput } from "./journey";

const NONE: JourneyInput = {
  phoneVerified: false,
  hasSubmission: false,
  hasAdvanced: false,
  hasVoted: false,
  hasPayout: false,
  tier: 0,
};

describe("computeJourney", () => {
  it("marks nothing achieved for a brand-new unverified user", () => {
    const milestones = computeJourney(NONE);
    expect(milestones.every((m) => !m.achieved)).toBe(true);
  });

  it("marks only verified for a verified user with no activity", () => {
    const milestones = computeJourney({ ...NONE, phoneVerified: true });
    expect(milestones.find((m) => m.key === "verified")?.achieved).toBe(true);
    expect(milestones.filter((m) => m.achieved)).toHaveLength(1);
  });

  it("marks every milestone once all conditions are met", () => {
    const milestones = computeJourney({
      phoneVerified: true,
      hasSubmission: true,
      hasAdvanced: true,
      hasVoted: true,
      hasPayout: true,
      tier: 2,
    });
    expect(milestones.every((m) => m.achieved)).toBe(true);
  });

  it("silver milestone only trips at tier >= 1", () => {
    expect(computeJourney({ ...NONE, tier: 0 }).find((m) => m.key === "silver")?.achieved).toBe(false);
    expect(computeJourney({ ...NONE, tier: 1 }).find((m) => m.key === "silver")?.achieved).toBe(true);
  });

  it("preserves milestone order for a stable stepper UI", () => {
    const keys = computeJourney(NONE).map((m) => m.key);
    expect(keys).toEqual(["verified", "first_entry", "advanced", "voted", "paid", "silver"]);
  });
});
