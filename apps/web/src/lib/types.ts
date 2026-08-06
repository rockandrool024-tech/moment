// Mirrors the Prisma enums/models in apps/api/prisma/schema.prisma. Kept
// hand-written rather than generated — Phase 1 has no shared-types package
// yet (see root README's build order for later phases).

export type UserRole = "seller" | "creator" | "both";

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  phoneVerifiedAt: string | null;
  displayName: string | null;
  stripeConnectAccountId: string | null;
  tier: number;
  tasteScore: number;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export type ChallengeStatus =
  | "draft"
  | "funded"
  | "round1_open"
  | "round2_open"
  | "round3_open"
  | "resolved"
  | "cancelled";

export interface Challenge {
  id: string;
  sellerId: string;
  title: string;
  brief: string;
  checklistCriteria: Record<string, unknown>;
  prizePool: number;
  stipendPool: number;
  takeRateBps: number;
  status: ChallengeStatus;
  stripePaymentIntentId: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export type SubmissionPhase = "teaser" | "full_content";
export type SubmissionStatus = "pending" | "advanced" | "eliminated";

export interface Submission {
  id: string;
  creatorId: string;
  challengeId: string;
  phase: SubmissionPhase;
  videoRef: string | null;
  videoStatus: string;
  status: SubmissionStatus;
  sellerScore: number | null;
  compositeScore: number | null;
  createdAt: string;
}

export type RoundType = "peer_vote_teaser" | "peer_vote_narrow" | "public_vote_final";
export type RoundStatus = "open" | "closed" | "tallied" | "revealed";

export interface Round {
  id: string;
  challengeId: string;
  roundNumber: number;
  type: RoundType;
  status: RoundStatus;
  advanceCount: number;
  opensAt: string;
  closesAt: string;
  revealDeadlineAt: string | null;
  revealedAt: string | null;
}

export interface Pair {
  a: string;
  b: string;
}

export interface Deck {
  id: string;
  userId: string;
  roundId: string;
  pairs: Pair[];
  checkPairIndex: number;
  completedAt: string | null;
  discarded: boolean;
}

export interface FundingBreakdown {
  prizePool: number;
  stipendPool: number;
  survivorBonusPool: number;
  platformFeeBase: number;
  platformFee: number;
  totalCharge: number;
  crowdFavourite: number;
}

export interface FundingResult {
  clientSecret: string;
  breakdown: FundingBreakdown;
}
