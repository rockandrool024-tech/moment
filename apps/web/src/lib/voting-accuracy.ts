// Voting Accuracy & Prediction Market Logic

export const VOTING_CONFIG = {
  MIN_VIEWS_FOR_VIRAL: 5000,
  VOTING_WINDOW_HOURS: 24,
  VIEW_SYNC_INTERVAL_MINUTES: 5,
};

export function determineVoteCorrectness(
  userVoteDirection: 'upvote' | 'downvote',
  finalViewCount: number
): boolean {
  const isViral = finalViewCount >= VOTING_CONFIG.MIN_VIEWS_FOR_VIRAL;

  if (userVoteDirection === 'upvote') {
    return isViral; // Upvoter was correct if story went viral
  } else {
    return !isViral; // Downvoter was correct if story didn't go viral
  }
}

export function calculateVotingAccuracy(correctVotes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0;
  return (correctVotes / totalVotes) * 100;
}

export interface VotingStats {
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  upvotePercentage: number;
  downvotePercentage: number;
}

export function getVotingStats(upvotes: number, downvotes: number): VotingStats {
  const total = upvotes + downvotes;
  return {
    totalVotes: total,
    upvotes,
    downvotes,
    upvotePercentage: total > 0 ? (upvotes / total) * 100 : 0,
    downvotePercentage: total > 0 ? (downvotes / total) * 100 : 0,
  };
}

export function isHealthyVotingDistribution(upvotePercentage: number): boolean {
  // Healthy: 50-80% upvotes (not all bias one way, but trending positive is ok)
  return upvotePercentage >= 50 && upvotePercentage <= 80;
}