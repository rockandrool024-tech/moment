-- Add a private storage reference for user-uploaded profile images.
-- The binary file remains on the persistent avatar volume; the database stores only its safe key.
ALTER TABLE "users" ADD COLUMN "avatar_file_key" TEXT;
