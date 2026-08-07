/**
 * Dev-only convenience: creates (or reuses) a phone-verified User and mints
 * a matching JWT, bypassing Twilio Verify entirely. Useful for local
 * testing when TWILIO_* env vars aren't configured with real credentials
 * (see apps/api/README.md), since the normal OTP flow can't work without them.
 *
 * Usage: pnpm --filter @moment/api exec ts-node -T scripts/create-test-user.ts \
 *          --phone "+15550001111" --role creator --name "Ana"
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

function arg(name: string, fallback?: string): string {
  const idx = process.argv.indexOf(`--${name}`);
  const value = idx !== -1 ? process.argv[idx + 1] : undefined;
  if (!value && fallback === undefined) {
    throw new Error(`Missing required --${name} argument`);
  }
  return value ?? fallback!;
}

async function main() {
  const phone = arg("phone");
  const role = arg("role", "creator") as "seller" | "creator" | "both";
  const displayName = arg("name", phone);

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set — copy apps/api/.env.example to .env first");
  }

  const prisma = new PrismaClient();
  const user = await prisma.user.upsert({
    where: { phone },
    create: { phone, role, displayName, phoneVerifiedAt: new Date() },
    update: { phoneVerifiedAt: new Date() },
  });
  await prisma.$disconnect();

  const token = jwt.sign({ sub: user.id, phone: user.phone }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  });

  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ user, accessToken: token }, null, 2));
}

main();
