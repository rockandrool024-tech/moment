// Mirrors the Prisma enums/models in apps/api/prisma/schema.prisma. Kept
// hand-written rather than generated — Phase 1 has no shared-types package
// yet (see root README's build order for later phases).

export type UserRole = "seller" | "creator" | "both";

export interface CharacterProfile {
  preset: "parrot" | "street" | "studio" | "night";
  palette: "tropical" | "coral" | "midnight" | "sand";
  updatedAt: string | null;
}

export interface User {
  id: string;
  role: UserRole;
  phone: string;
  phoneVerifiedAt: string | null;
  displayName: string | null;
  stripeConnectAccountId: string | null;
  tier: number;
  tasteScore: number;
  rallyXp: number;
  referralCode: string;
  kybVerified: boolean;
  kybRequestedAt: string | null;
  lifetimeEarnings: number;
  lastVoteDate: string | null;
  streakCount: number;
  streakPausedReason: string | null;
  location: string | null;
  coinBalance: number;
  createdAt: string;
  updatedAt: string;
}

// ── Cosmetic currency (crypto checkout) ────────────────────────────────────

export interface CoinPackage {
  id: string;
  coins: number;
  priceUsd: number;
  label: string;
}

export interface CoinsSummary {
  coinBalance: number;
  packages: CoinPackage[];
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
  playbackId?: string | null;
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
  finalPickSubmissionId: string | null;
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

// ── Growth (rally / share cards / public spectator) ─────────────────────

export interface SubmissionWithOutcome extends Submission {
  isWinner: boolean;
  challenge: { title: string; prizePool: number };
  creatorReferralCode: string;
  creatorTier: number;
}

export interface RallyStats {
  totalVoters: number;
  rallyXp: number;
}

export interface StreakSummary {
  streakCount: number;
  lastVoteDate: string | null;
  streakPausedReason: string | null;
}

export interface PublicChallengeSummary {
  id: string;
  title: string;
  brief: string;
  prizePool: number;
  stipendPool: number;
  status: ChallengeStatus;
  currentRound: {
    id: string;
    roundNumber: number;
    type: RoundType;
    status: RoundStatus;
    closesAt: string;
  } | null;
}

export interface PublicTally {
  roundId: string;
  visible: boolean;
  tallies: { submissionId: string; votes: number }[];
}

export interface DiscoveryCreator {
  id: string;
  displayName: string | null;
  tier: number;
  wins: number;
  referralCode: string;
  location: string | null;
}

export interface DiscoveryBrand {
  id: string;
  displayName: string | null;
  activeChallengeCount: number;
  activePrizePoolCents: number;
  isColdStart: boolean;
  location: string | null;
}

export interface MapPin {
  id: string;
  kind: "creator" | "challenge";
  displayName: string | null;
  referralCode: string | null;
  tier: number;
  x: number;
  y: number;
  heightScale: number;
  meta: string;
  rank: number;
  count: number;
}

// ── Video feed ──────────────────────────────────────────────────────────

export interface FeedVideo {
  id: string;
  playbackId: string;
  creatorId: string;
  creatorName: string | null;
  challengeTitle: string;
  challengeId: string;
  voteCount: number;
}

export interface MapNearbyResponse {
  pins: MapPin[];
}

// ── Campaign analytics (seller-only funnel) ──────────────────────────────

export type PayoutType = "winner" | "stipend" | "survivor_bonus" | "crowd_favourite" | "referral_bonus";

export interface PhaseFunnelStats {
  phase: SubmissionPhase;
  submitted: number;
  advanced: number;
  eliminated: number;
  pending: number;
}

export interface RoundVoteStats {
  roundId: string;
  roundNumber: number;
  type: RoundType;
  votes: number;
}

export interface PayoutTypeStats {
  type: PayoutType;
  count: number;
  totalAmount: number;
}

export interface ChallengeAnalytics {
  challengeId: string;
  phases: PhaseFunnelStats[];
  rounds: RoundVoteStats[];
  payouts: PayoutTypeStats[];
}

// ── Wallet / trust (sprint 1) ────────────────────────────────────────────

export interface WalletPayoutRow {
  id: string;
  type: string;
  amount: number;
  status: string;
  challengeName: string;
  createdAt: string;
  paidAt: string | null;
}

export interface WalletSummary {
  currentBalanceCents: number;
  lifetimeEarningsCents: number;
  pendingPayoutsCents: number;
  payoutHistory: WalletPayoutRow[];
}

// ── Referrals / notifications (Sprint 4) ─────────────────────────────────

export interface ReferralStats {
  totalReferred: number;
  totalRewardedCents: number;
  pendingCount: number;
}

export type NotificationType =
  | "challenge_invite"
  | "payout"
  | "round_result"
  | "streak"
  | "mention"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

// ── Admin (Sprint 4) ──────────────────────────────────────────────────────

export interface AdminChallengeDetail extends Challenge {
  rounds: Round[];
  submissions: { id: string; creatorId: string; phase: SubmissionPhase; status: SubmissionStatus }[];
  payouts: { id: string; userId: string; type: PayoutType; amount: number; status: string }[];
}

export interface StuckRound extends Round {
  challenge: { title: string };
}

export type DisputeStatus = "open" | "upheld" | "denied";

export interface Dispute {
  id: string;
  submissionId: string;
  challengeId: string;
  raisedById: string;
  reason: string;
  status: DisputeStatus;
  resolution: string | null;
  resolvedById: string | null;
  createdAt: string;
  resolvedAt: string | null;
  submission: { id: string; creatorId: string; status: SubmissionStatus };
}

export interface GrowthDashboard {
  voteDeckCompletionRate: number;
  avgEntriesPerCampaign: number;
  brandRepeatRate: number;
  avgTimeToFirstPayoutHours: number | null;
  rallyKProxy: number;
  retentionD1D7D30: string;
}

// ADR-004's two distinct stat blocks — a `both`-role user can have both.
export interface TrustStats {
  creator: {
    wins: number;
    finalsRate: number;
    brandScore: number | null;
    brandScoreCount: number;
  } | null;
  brand: {
    campaignsRun: number;
    totalPaidOutCents: number;
    onTimePayoutRate: number | null;
    creatorScore: number | null;
    creatorScoreCount: number;
    isColdStart: boolean;
    escrowedCents: number;
  } | null;
}

// ── Stories (Perokio) — Story generalizes Challenge; a FREE/OPEN Story has
// no Challenge at all. ExternalPost views/likes are creator-entered display
// data only, never fed into any score/tally/payout. ──────────────────────

export type StoryAccess = "FREE" | "PAID";
export type StoryMode = "OPEN" | "CHALLENGE";

export interface Story {
  id: string;
  sellerId: string;
  title: string;
  brief: string;
  access: StoryAccess;
  mode: StoryMode;
  challengeId: string | null;
  createdAt: string;
}

export interface ExternalPost {
  id: string;
  contentId: string;
  platform: string;
  url: string;
  views: number | null;
  likes: number | null;
  addedAt: string;
}

export interface Content {
  id: string;
  storyClaimId: string;
  mediaUrl: string | null;
  caption: string | null;
  externalPosts: ExternalPost[];
  createdAt: string;
}

export interface StoryClaim {
  id: string;
  storyId: string;
  creatorId: string;
  claimedAt: string;
  story?: Story;
  content?: Content | null;
}

export type StoryStage = "submitted" | "claimed" | "content_added" | "posted";

// A seller's own Story with a claim/content/engagement rollup — see
// StoriesService.myStories. reportedViews/reportedLikes are a sum of
// creator-entered numbers, never verified — same status as ExternalPost's
// own fields, just aggregated for the storyteller's dashboard.
export interface MyStorySummary {
  id: string;
  title: string;
  access: StoryAccess;
  mode: StoryMode;
  createdAt: string;
  stage: StoryStage;
  claimCount: number;
  contentCount: number;
  postCount: number;
  reportedViews: number;
  reportedLikes: number;
}

// ── Creator journey ───────────────────────────────────────────────────────

export interface JourneyMilestone {
  key: string;
  label: string;
  achieved: boolean;
}
