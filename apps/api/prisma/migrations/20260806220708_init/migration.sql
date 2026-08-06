-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('seller', 'creator', 'both');

-- CreateEnum
CREATE TYPE "ChallengeStatus" AS ENUM ('draft', 'funded', 'round1_open', 'round2_open', 'round3_open', 'resolved', 'cancelled');

-- CreateEnum
CREATE TYPE "SubmissionPhase" AS ENUM ('teaser', 'full_content');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'advanced', 'eliminated');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('peer_vote_teaser', 'peer_vote_narrow', 'public_vote_final');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('open', 'closed', 'tallied', 'revealed');

-- CreateEnum
CREATE TYPE "VotePool" AS ENUM ('quality', 'rally');

-- CreateEnum
CREATE TYPE "PayoutType" AS ENUM ('winner', 'stipend', 'survivor_bonus', 'crowd_favourite');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('pending', 'processing', 'paid', 'failed');

-- CreateEnum
CREATE TYPE "RatingDirection" AS ENUM ('creator_to_brand', 'brand_to_creator');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT NOT NULL,
    "phone_verified_at" TIMESTAMP(3),
    "display_name" TEXT,
    "stripe_connect_account_id" TEXT,
    "tier" INTEGER NOT NULL DEFAULT 0,
    "taste_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rally_xp" INTEGER NOT NULL DEFAULT 0,
    "referral_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "challenges" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "checklist_criteria" JSONB NOT NULL,
    "prize_pool" INTEGER NOT NULL,
    "stipend_pool" INTEGER NOT NULL DEFAULT 0,
    "take_rate_bps" INTEGER NOT NULL DEFAULT 2000,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'draft',
    "stripe_payment_intent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "phase" "SubmissionPhase" NOT NULL,
    "video_ref" TEXT,
    "video_status" TEXT NOT NULL DEFAULT 'pending',
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "seller_score" INTEGER,
    "composite_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rounds" (
    "id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "type" "RoundType" NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'open',
    "advance_count" INTEGER NOT NULL,
    "opens_at" TIMESTAMP(3) NOT NULL,
    "closes_at" TIMESTAMP(3) NOT NULL,
    "reveal_deadline_at" TIMESTAMP(3),
    "revealed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "peer_votes" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "deck_id" TEXT NOT NULL,
    "pair_index" INTEGER NOT NULL,
    "voter_submission_id" TEXT NOT NULL,
    "voter_user_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "loser_submission_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "peer_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "pairs" JSONB NOT NULL,
    "check_pair_index" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3),
    "discarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "voter_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "pool" "VotePool" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rally_attributions" (
    "id" TEXT NOT NULL,
    "voter_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rally_attributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "round_id" TEXT NOT NULL,
    "submission_id" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL,
    "correct" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payouts" (
    "id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" "PayoutType" NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'pending',
    "stripe_transfer_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "payout_due_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "rater_id" TEXT NOT NULL,
    "ratee_id" TEXT NOT NULL,
    "direction" "RatingDirection" NOT NULL,
    "score" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "challenges_seller_id_idx" ON "challenges"("seller_id");

-- CreateIndex
CREATE INDEX "challenges_status_idx" ON "challenges"("status");

-- CreateIndex
CREATE INDEX "submissions_challenge_id_phase_idx" ON "submissions"("challenge_id", "phase");

-- CreateIndex
CREATE INDEX "submissions_creator_id_idx" ON "submissions"("creator_id");

-- CreateIndex
CREATE INDEX "rounds_status_idx" ON "rounds"("status");

-- CreateIndex
CREATE UNIQUE INDEX "rounds_challenge_id_round_number_key" ON "rounds"("challenge_id", "round_number");

-- CreateIndex
CREATE INDEX "peer_votes_round_id_voter_user_id_idx" ON "peer_votes"("round_id", "voter_user_id");

-- CreateIndex
CREATE INDEX "peer_votes_submission_id_idx" ON "peer_votes"("submission_id");

-- CreateIndex
CREATE INDEX "peer_votes_loser_submission_id_idx" ON "peer_votes"("loser_submission_id");

-- CreateIndex
CREATE UNIQUE INDEX "peer_votes_deck_id_pair_index_key" ON "peer_votes"("deck_id", "pair_index");

-- CreateIndex
CREATE UNIQUE INDEX "decks_user_id_round_id_key" ON "decks"("user_id", "round_id");

-- CreateIndex
CREATE INDEX "votes_submission_id_pool_idx" ON "votes"("submission_id", "pool");

-- CreateIndex
CREATE UNIQUE INDEX "votes_round_id_voter_id_key" ON "votes"("round_id", "voter_id");

-- CreateIndex
CREATE INDEX "rally_attributions_creator_id_idx" ON "rally_attributions"("creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "rally_attributions_voter_id_creator_id_key" ON "rally_attributions"("voter_id", "creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_user_id_round_id_key" ON "predictions"("user_id", "round_id");

-- CreateIndex
CREATE INDEX "payouts_challenge_id_idx" ON "payouts"("challenge_id");

-- CreateIndex
CREATE INDEX "payouts_user_id_idx" ON "payouts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_challenge_id_rater_id_ratee_id_key" ON "ratings"("challenge_id", "rater_id", "ratee_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_eventId_key" ON "webhook_events"("provider", "eventId");

-- AddForeignKey
ALTER TABLE "challenges" ADD CONSTRAINT "challenges_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rounds" ADD CONSTRAINT "rounds_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_votes" ADD CONSTRAINT "peer_votes_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_votes" ADD CONSTRAINT "peer_votes_deck_id_fkey" FOREIGN KEY ("deck_id") REFERENCES "decks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_votes" ADD CONSTRAINT "peer_votes_voter_user_id_fkey" FOREIGN KEY ("voter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "peer_votes" ADD CONSTRAINT "peer_votes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decks" ADD CONSTRAINT "decks_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rally_attributions" ADD CONSTRAINT "rally_attributions_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rally_attributions" ADD CONSTRAINT "rally_attributions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rally_attributions" ADD CONSTRAINT "rally_attributions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "rounds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predictions" ADD CONSTRAINT "predictions_submission_id_fkey" FOREIGN KEY ("submission_id") REFERENCES "submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_rater_id_fkey" FOREIGN KEY ("rater_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_ratee_id_fkey" FOREIGN KEY ("ratee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
