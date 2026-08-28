// Level System & Reputation Logic

export const LEVEL_CONFIG = {
  LEVEL_THRESHOLDS: [
    0, // Level 0: 0 points
    100, // Level 1: 100 points
    300, // Level 2: 300 points
    600, // Level 3: 600 points
    1100, // Level 4: 1,100 points
    1700, // Level 5: 1,700 points
    2400, // Level 6: 2,400 points
    3200, // Level 7: 3,200 points
    4100, // Level 8: 4,100 points
    5100, // Level 9: 5,100 points
    6200, // Level 10: 6,200+ points
  ],
  VOTING_ACCURACY_WEIGHT: 0.3,
  ENGAGEMENT_RATE_WEIGHT: 0.4,
  FOLLOWER_COUNT_WEIGHT: 0.3,
};

export function calculateLevel(totalLifetimePoints: number): number {
  for (let i = LEVEL_CONFIG.LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalLifetimePoints >= LEVEL_CONFIG.LEVEL_THRESHOLDS[i]) {
      return i;
    }
  }
  return 0;
}

export function getPointsToNextLevel(totalPoints: number): number {
  const currentLevel = calculateLevel(totalPoints);
  if (currentLevel >= LEVEL_CONFIG.LEVEL_THRESHOLDS.length - 1) {
    return 0; // Max level
  }
  const nextThreshold = LEVEL_CONFIG.LEVEL_THRESHOLDS[currentLevel + 1];
  return Math.max(0, nextThreshold - totalPoints);
}

export function calculateLevelScore(
  votingAccuracy: number, // 0-100
  engagementRate: number, // 0-100
  followerCount: number
): number {
  const normalizedFollowers = Math.min(followerCount / 10000, 1) * 100; // Cap at 10K followers

  return (
    votingAccuracy * LEVEL_CONFIG.VOTING_ACCURACY_WEIGHT +
    engagementRate * LEVEL_CONFIG.ENGAGEMENT_RATE_WEIGHT +
    normalizedFollowers * LEVEL_CONFIG.FOLLOWER_COUNT_WEIGHT
  );
}

export function getLevelBadgeColor(level: number): string {
  if (level >= 9) return '#7ee0c9'; // Platinum
  if (level >= 6) return '#e6b93c'; // Gold
  if (level >= 3) return '#b9c2c9'; // Silver
  return '#c9834b'; // Bronze
}

export function getLevelLabel(level: number): string {
  const labels = [
    'Newbie',
    'Starter',
    'Rising',
    'Strong',
    'Verified',
    'Master',
    'Elite',
    'Legend',
    'Superstar',
    'Icon',
    'Pinnacle',
  ];
  return labels[Math.min(level, labels.length - 1)];
}