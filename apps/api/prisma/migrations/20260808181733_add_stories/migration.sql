-- CreateEnum
CREATE TYPE "StoryAccess" AS ENUM ('FREE', 'PAID');

-- CreateEnum
CREATE TYPE "StoryMode" AS ENUM ('OPEN', 'CHALLENGE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "perokio_score" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "stories" (
    "id" TEXT NOT NULL,
    "seller_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "brief" TEXT NOT NULL,
    "access" "StoryAccess" NOT NULL DEFAULT 'FREE',
    "mode" "StoryMode" NOT NULL DEFAULT 'OPEN',
    "challenge_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_claims" (
    "id" TEXT NOT NULL,
    "story_id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content" (
    "id" TEXT NOT NULL,
    "story_claim_id" TEXT NOT NULL,
    "media_url" TEXT,
    "caption" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_posts" (
    "id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "views" INTEGER,
    "likes" INTEGER,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "external_posts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stories_challenge_id_key" ON "stories"("challenge_id");

-- CreateIndex
CREATE INDEX "stories_seller_id_idx" ON "stories"("seller_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_claims_story_id_creator_id_key" ON "story_claims"("story_id", "creator_id");

-- CreateIndex
CREATE UNIQUE INDEX "content_story_claim_id_key" ON "content"("story_claim_id");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "challenges"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_claims" ADD CONSTRAINT "story_claims_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_claims" ADD CONSTRAINT "story_claims_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content" ADD CONSTRAINT "content_story_claim_id_fkey" FOREIGN KEY ("story_claim_id") REFERENCES "story_claims"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_posts" ADD CONSTRAINT "external_posts_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "content"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

