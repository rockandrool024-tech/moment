// Pure scoring functions for the round state machine — kept dependency-free
// so they're trivially unit-testable. This, alongside the state transitions
// in round-state-machine.service.ts, is the "crux" ADR-001 calls out.

export interface PeerVoteWeights {
  peerVoteWeight: number; // 0.7 per README/ADR-003
  sellerScoreWeight: number; // 0.3
}

/**
 * Composite score for a teaser/full-content submission: peer-vote win rate
 * (0-1) weighted 70%, seller's 1-5 light score normalized to 0-1 weighted
 * 30%. A submission with zero peer-vote appearances scores 0 on that half
 * rather than dividing by zero.
 */
export function computeComposite(
  peerVoteWins: number,
  peerVoteTotal: number,
  sellerScore: number | null,
  weights: PeerVoteWeights,
): number {
  const winRate = peerVoteTotal > 0 ? peerVoteWins / peerVoteTotal : 0;
  const normalizedSellerScore = sellerScore !== null ? (sellerScore - 1) / 4 : 0;
  return winRate * weights.peerVoteWeight + normalizedSellerScore * weights.sellerScoreWeight;
}

/**
 * ADR-005 open question #1 (still a placeholder): a creator who hasn't cast
 * the required number of peer votes gets their composite multiplied down
 * rather than being auto-eliminated outright.
 */
export function applyParticipationPenalty(
  composite: number,
  votesCast: number,
  gateThreshold: number,
  penaltyMultiplier: number,
): number {
  return votesCast < gateThreshold ? composite * penaltyMultiplier : composite;
}

export interface RankedSubmission {
  submissionId: string;
  composite: number;
}

export interface RankResult {
  advancedSubmissionIds: string[];
  eliminatedSubmissionIds: string[];
}

/** Highest composite first; ties broken by submissionId for determinism. */
export function rankAndSelectAdvancers(
  submissions: RankedSubmission[],
  advanceCount: number,
): RankResult {
  const sorted = [...submissions].sort((a, b) => {
    if (b.composite !== a.composite) return b.composite - a.composite;
    return a.submissionId.localeCompare(b.submissionId);
  });

  return {
    advancedSubmissionIds: sorted.slice(0, advanceCount).map((s) => s.submissionId),
    eliminatedSubmissionIds: sorted.slice(advanceCount).map((s) => s.submissionId),
  };
}

/** Whether every voter in the list has cast at least `gateThreshold` peer votes. */
export function isParticipationGateSatisfied(
  votesCastByVoter: Map<string, number>,
  activeVoterIds: string[],
  gateThreshold: number,
): boolean {
  return activeVoterIds.every((voterId) => (votesCastByVoter.get(voterId) ?? 0) >= gateThreshold);
}
