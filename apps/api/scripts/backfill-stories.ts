/**
 * One-off backfill: create a Story row (access: PAID, mode: CHALLENGE) for
 * every existing Challenge that doesn't already have one, linked via
 * Story.challengeId. All v1 challenges had a funded prize pool, so PAID is
 * the correct access value for every backfilled row — new Stories created
 * going forward can be FREE/OPEN.
 *
 * Idempotent: safe to re-run, only touches Challenges with no linked Story.
 *
 * Usage: pnpm --filter @moment/api exec ts-node -T scripts/backfill-stories.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();

  const challenges = await prisma.challenge.findMany({
    where: { story: null },
    select: { id: true, sellerId: true, title: true, brief: true },
  });

  if (challenges.length === 0) {
    // eslint-disable-next-line no-console
    console.log("Nothing to backfill — every Challenge already has a linked Story.");
    await prisma.$disconnect();
    return;
  }

  const created = await prisma.$transaction(
    challenges.map((c) =>
      prisma.story.create({
        data: {
          sellerId: c.sellerId,
          title: c.title,
          brief: c.brief,
          access: "PAID",
          mode: "CHALLENGE",
          challengeId: c.id,
        },
      }),
    ),
  );

  // eslint-disable-next-line no-console
  console.log(`Backfilled ${created.length} Story row(s) for existing Challenges.`);
  await prisma.$disconnect();
}

main();
