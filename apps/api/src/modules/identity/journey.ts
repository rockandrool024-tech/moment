// Creator journey milestones — pure function, unit-tested like tier.ts.
// Every milestone is derived from data that already exists (submissions,
// votes, payouts, tier); nothing here depends on the new Story models.
export interface JourneyInput {
  phoneVerified: boolean;
  hasSubmission: boolean;
  hasAdvanced: boolean;
  hasVoted: boolean;
  hasPayout: boolean;
  tier: number;
}

export interface JourneyMilestone {
  key: string;
  label: string;
  achieved: boolean;
}

export function computeJourney(input: JourneyInput): JourneyMilestone[] {
  return [
    { key: "verified", label: "Verified your phone", achieved: input.phoneVerified },
    { key: "first_entry", label: "Entered your first challenge", achieved: input.hasSubmission },
    { key: "advanced", label: "Advanced a round", achieved: input.hasAdvanced },
    { key: "voted", label: "Cast a vote", achieved: input.hasVoted },
    { key: "paid", label: "Got paid", achieved: input.hasPayout },
    { key: "silver", label: "Reached Silver tier", achieved: input.tier >= 1 },
  ];
}
