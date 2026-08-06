import {
  applyParticipationPenalty,
  computeComposite,
  isParticipationGateSatisfied,
  rankAndSelectAdvancers,
} from "./scoring";

const WEIGHTS = { peerVoteWeight: 0.7, sellerScoreWeight: 0.3 };

describe("computeComposite", () => {
  it("weights peer win-rate at 70% and normalized seller score at 30%", () => {
    // 3/4 win rate -> 0.75; seller score 5/5 -> normalized 1.0
    const composite = computeComposite(3, 4, 5, WEIGHTS);
    expect(composite).toBeCloseTo(0.75 * 0.7 + 1.0 * 0.3, 5);
  });

  it("normalizes a seller score of 1 to 0, not a small positive number", () => {
    const composite = computeComposite(0, 0, 1, WEIGHTS);
    expect(composite).toBeCloseTo(0, 5);
  });

  it("does not divide by zero when a submission has no peer-vote appearances yet", () => {
    const composite = computeComposite(0, 0, 3, WEIGHTS);
    expect(Number.isFinite(composite)).toBe(true);
    expect(composite).toBeCloseTo(((3 - 1) / 4) * 0.3, 5);
  });

  it("scores 0 when there is neither peer-vote data nor a seller score", () => {
    expect(computeComposite(0, 0, null, WEIGHTS)).toBe(0);
  });
});

describe("applyParticipationPenalty", () => {
  it("leaves composite untouched once the gate is met", () => {
    expect(applyParticipationPenalty(0.8, 8, 8, 0.9)).toBe(0.8);
    expect(applyParticipationPenalty(0.8, 12, 8, 0.9)).toBe(0.8);
  });

  it("applies the penalty multiplier when under the gate", () => {
    expect(applyParticipationPenalty(0.8, 5, 8, 0.9)).toBeCloseTo(0.72, 5);
  });

  it("applies the penalty for a creator who cast zero votes", () => {
    expect(applyParticipationPenalty(0.8, 0, 8, 0.9)).toBeCloseTo(0.72, 5);
  });
});

describe("rankAndSelectAdvancers", () => {
  it("advances the top N by composite score, descending", () => {
    const submissions = [
      { submissionId: "a", composite: 0.5 },
      { submissionId: "b", composite: 0.9 },
      { submissionId: "c", composite: 0.7 },
      { submissionId: "d", composite: 0.2 },
    ];
    const { advancedSubmissionIds, eliminatedSubmissionIds } = rankAndSelectAdvancers(
      submissions,
      2,
    );
    expect(advancedSubmissionIds).toEqual(["b", "c"]);
    expect(eliminatedSubmissionIds).toEqual(["a", "d"]);
  });

  it("breaks exact ties deterministically by submissionId", () => {
    const submissions = [
      { submissionId: "z", composite: 0.5 },
      { submissionId: "a", composite: 0.5 },
    ];
    const { advancedSubmissionIds } = rankAndSelectAdvancers(submissions, 1);
    expect(advancedSubmissionIds).toEqual(["a"]);
  });

  it("advances everyone if advanceCount exceeds the field size", () => {
    const submissions = [{ submissionId: "a", composite: 0.1 }];
    const { advancedSubmissionIds, eliminatedSubmissionIds } = rankAndSelectAdvancers(
      submissions,
      5,
    );
    expect(advancedSubmissionIds).toEqual(["a"]);
    expect(eliminatedSubmissionIds).toEqual([]);
  });
});

describe("isParticipationGateSatisfied", () => {
  it("is satisfied only when every active voter meets the threshold", () => {
    const votes = new Map([
      ["voter-1", 8],
      ["voter-2", 8],
    ]);
    expect(isParticipationGateSatisfied(votes, ["voter-1", "voter-2"], 8)).toBe(true);
  });

  it("is not satisfied when any active voter is under the threshold", () => {
    const votes = new Map([
      ["voter-1", 8],
      ["voter-2", 3],
    ]);
    expect(isParticipationGateSatisfied(votes, ["voter-1", "voter-2"], 8)).toBe(false);
  });

  it("treats a voter absent from the map as having cast zero votes", () => {
    const votes = new Map([["voter-1", 8]]);
    expect(isParticipationGateSatisfied(votes, ["voter-1", "voter-2"], 8)).toBe(false);
  });

  it("is vacuously satisfied when there are no active voters", () => {
    expect(isParticipationGateSatisfied(new Map(), [], 8)).toBe(true);
  });
});
