-- CreateIndex
CREATE UNIQUE INDEX "payouts_challenge_id_user_id_type_key" ON "payouts"("challenge_id", "user_id", "type");

