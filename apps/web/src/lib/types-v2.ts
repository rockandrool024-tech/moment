// MOMENT v2 - Core Domain Types
// Complete rewrite for multi-platform, prediction market, reputation system

export type UserRole = 'creator' | 'facts_provider';
export type SocialPlatform = 'tiktok' | 'instagram' | 'facebook';
export type StoryStatus = 'pending_approval' | 'approved' | 'posted' | 'payout_done';
export type VoteDirection = 'upvote' | 'downvote';
export type FactsContentType = 'text' | 'audio' | 'video';

// ═══════════════════════════════════════════════════════════════
// USER & SOCIAL
// ═══════════════════════════════════════════════════════════════

export interface User {
  id: string;
  phone: string;
  displayName?: string;
  role: UserRole;
  avatar?: string;
  level: number;
  tasteScore: number;
  referralCode: string;
  phoneVerifiedAt?: string;
  anonymous: boolean;
  sectorsOfInfluence: string[];
  country: string;
  city: string;
  profileVisibility: 'public' | 'private';
  updatedAt: string;
}

export interface SocialConnection {
  id: string;
  userId: string;
  platform: SocialPlatform;
  platformId: string;
  accessToken: string;
  followersCount: number;
  connectedAt: string;
  lastSyncedAt: string;
}

export interface UserLevel {
  userId: string;
  currentLevel: number;
  pointsTowardsNextLevel: number;
  totalLifetimePoints: number;
  engagementRate: number;
  followerCount: number;
  updatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// STORIES & CONTENT
// ═══════════════════════════════════════════════════════════════

export interface Story {
  id: string;
  creatorId: string;
  title: string;
  caption: string;
  videoUrl: string;
  thumbnailUrl?: string;
  postedToTikTok: boolean;
  postedToInstagram: boolean;
  postedToFacebook: boolean;
  postedAt?: string;
  payoutCycleEndsAt?: string;
  viewsTikTok: number;
  viewsInstagram: number;
  viewsFacebook: number;
  viewsApp: number;
  totalViews: number;
  status: StoryStatus;
  creatorRewardPool: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoryProgress {
  storyId: string;
  viewsTikTok: number;
  viewsTiktokTrend: string;
  viewsInstagram: number;
  viewsInstagramTrend: string;
  viewsFacebook: number;
  viewsFacebookTrend: string;
  viewsApp: number;
  totalViews: number;
  pointsEarned: number;
  votersCount: number;
  upvoteCount: number;
  downvoteCount: number;
  engagementRate: number;
  timeRemaining: number; // seconds
  progressPercent: number; // 0-100
  lastUpdatedAt: string;
}

export interface Fact {
  id: string;
  providerId: string;
  title: string;
  content: string;
  contentType: FactsContentType;
  isPaid: boolean;
  costInPoints?: number;
  rating: number;
  ratingCount: number;
  viewsTikTok: number;
  viewsInstagram: number;
  viewsFacebook: number;
  viewsApp: number;
  totalViews: number;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// VOTING & PREDICTION MARKET
// ═══════════════════════════════════════════════════════════════

export interface Vote {
  id: string;
  userId: string;
  storyId: string;
  direction: VoteDirection;
  isCorrect?: boolean;
  pointsEarned: number;
  createdAt: string;
}

export interface VotingRound {
  id: string;
  storyId: string;
  startedAt: string;
  endedAt?: string;
  finalViewCount: number;
  totalUpvotes: number;
  totalDownvotes: number;
  creatorRewardPool: number;
}

export interface VoteResult {
  storyId: string;
  finalViewCount: number;
  isViral: boolean; // > 5K views
  userVoteDirection: VoteDirection;
  userVoteCorrect: boolean;
  pointsEarned: {
    participation: number; // +10
    accuracy: number; // +5 if correct
    creatorReward: number; // shared pool
  };
}

// ═══════════════════════════════════════════════════════════════
// PARROT POINTS ECONOMY
// ═══════════════════════════════════════════════════════════════

export interface ParrotPoints {
  id: string;
  userId: string;
  amount: number;
  source: 'views' | 'voting_accuracy' | 'referral' | 'creator_reward';
  storyId?: string;
  createdAt: string;
  spentAt?: string;
}

export interface ParrotPointsBalance {
  available: number;
  pending: number;
  totalEarned: number;
  totalSpent: number;
  pendingPayouts: {
    storyId: string;
    amount: number;
    payoutAt: string;
  }[];
}

export interface EarningsBreakdown {
  viewsEarned: number;
  votingRewards: number;
  creatorShared: number;
  referralBonuses: number;
  totalEarned: number;
}

// ═══════════════════════════════════════════════════════════════
// REFERRALS & GROWTH
// ═══════════════════════════════════════════════════════════════

export interface Referral {
  id: string;
  referrerId: string;
  referredUserId?: string;
  referralLink: string;
  referralCode: string;
  clickedAt?: string;
  accountCreatedAt?: string;
  bonusPointsAwarded: number;
  createdAt: string;
}

export interface ReferralStats {
  totalInvitesSent: number;
  totalSignups: number;
  conversionRate: number;
  totalBonusPointsEarned: number;
}

// ═══════════════════════════════════════════════════════════════
// WALLET & EARNINGS
// ═══════════════════════════════════════════════════════════════

export interface WalletSummary {
  availableBalance: number;
  pendingPayouts: number;
  lifetimeEarnings: number;
  earningsBreakdown: EarningsBreakdown;
  payoutHistory: PayoutRecord[];
}

export interface PayoutRecord {
  id: string;
  storyId?: string;
  source: string;
  amount: number;
  status: 'pending' | 'processing' | 'paid' | 'failed';
  createdAt: string;
  paidAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// API RESPONSES
// ═══════════════════════════════════════════════════════════════

export interface ApiResponse<T> {
  data: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  cursor?: string;
  hasMore: boolean;
}