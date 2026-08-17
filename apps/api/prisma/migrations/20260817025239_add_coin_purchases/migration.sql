-- CreateEnum
CREATE TYPE "CoinPurchaseStatus" AS ENUM ('pending', 'completed', 'expired');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "coin_balance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "coin_purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "coins" INTEGER NOT NULL,
    "price_usd_cents" INTEGER NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'coinbase_commerce',
    "provider_charge_id" TEXT NOT NULL,
    "status" "CoinPurchaseStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "coin_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coin_purchases_provider_charge_id_key" ON "coin_purchases"("provider_charge_id");

-- CreateIndex
CREATE INDEX "coin_purchases_user_id_idx" ON "coin_purchases"("user_id");

-- AddForeignKey
ALTER TABLE "coin_purchases" ADD CONSTRAINT "coin_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
