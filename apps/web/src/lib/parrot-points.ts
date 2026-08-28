// Parrot Points Economy Logic

export const PARROT_POINTS_CONFIG = {
  VIEW_TO_POINT_RATIO: 0.1, // 1 view = 0.1 points
  VOTE_PARTICIPATION_BONUS: 10,
  VOTE_ACCURACY_BONUS: 5,
  REFERRAL_BONUS: 50,
  MIN_VIEWS_FOR_VIRAL: 5000,
  CASH_OUT_RATE: 0.01, // 1 point = $0.01
  MAX_MONTHLY_CASHOUT: 10000, // points
};

export function calculatePointsFromViews(viewCount: number): number {
  return Math.floor(viewCount * PARROT_POINTS_CONFIG.VIEW_TO_POINT_RATIO);
}

export function calculateVotingReward(
  isCorrect: boolean,
  creatorRewardPoolSize?: number,
  totalCorrectVoters?: number
): number {
  let points = PARROT_POINTS_CONFIG.VOTE_PARTICIPATION_BONUS; // +10 always

  if (isCorrect) {
    points += PARROT_POINTS_CONFIG.VOTE_ACCURACY_BONUS; // +5

    // Share from creator reward pool
    if (creatorRewardPoolSize && totalCorrectVoters && totalCorrectVoters > 0) {
      const sharedReward = Math.floor(creatorRewardPoolSize / totalCorrectVoters);
      points += sharedReward;
    }
  }

  return points;
}

export function calculateCashoutAmount(pointsAmount: number): number {
  return pointsAmount * PARROT_POINTS_CONFIG.CASH_OUT_RATE;
}

export function isViral(totalViews: number): boolean {
  return totalViews >= PARROT_POINTS_CONFIG.MIN_VIEWS_FOR_VIRAL;
}

export function getPointsBreakdown(earnings: {
  views: number;
  correctVotes: number;
  referrals: number;
  creatorShared: number;
}) {
  return {
    fromViews: calculatePointsFromViews(earnings.views),
    fromVoting: PARROT_POINTS_CONFIG.VOTE_PARTICIPATION_BONUS * (earnings.correctVotes + earnings.referrals),
    fromReferrals: earnings.referrals * PARROT_POINTS_CONFIG.REFERRAL_BONUS,
    fromCreatorReward: earnings.creatorShared,
    total:
      calculatePointsFromViews(earnings.views) +
      PARROT_POINTS_CONFIG.VOTE_PARTICIPATION_BONUS * (earnings.correctVotes + earnings.referrals) +
      earnings.referrals * PARROT_POINTS_CONFIG.REFERRAL_BONUS +
      earnings.creatorShared,
  };
}