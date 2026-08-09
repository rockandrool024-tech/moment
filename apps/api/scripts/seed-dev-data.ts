/**
 * Dev-only: populates the local DB with a realistic spread of test data —
 * two brands, six creators, four challenges in different lifecycle states
 * (resolved/paid, live peer-vote, live public-vote, unfunded draft), two
 * Stories (one unclaimed, one claimed with content), a referral, ratings,
 * and a couple of notifications. Everything titled with a "[Seed]" prefix
 * so it's easy to spot and safe to re-run — if seed challenges already
 * exist, creation is skipped and this just reprints login tokens.
 *
 * Uses the real PayoutsService for the resolved challenge's payouts (same
 * DI-stub pattern as verify-round3-payout.ts) so tier/lifetimeEarnings
 * update exactly the way they would in production — everything else is
 * direct Prisma writes, since the goal is a realistic *end state* to click
 * through, not a re-verification of the tally algorithm (that's what the
 * existing unit tests and verify-round3-payout.ts already cover).
 *
 * Usage: pnpm --filter @moment/api exec ts-node -T scripts/seed-dev-data.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { PayoutsService } from "../src/modules/payments/payouts.service";
import { StripeService } from "../src/modules/payments/stripe.service";
import { computeFundingBreakdown } from "../src/modules/payments/pricing";

const SEED_PREFIX = "[Seed]";

function mintToken(userId: string, phone: string): string {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not set — copy apps/api/.env.example to .env first");
  }
  return jwt.sign({ sub: userId, phone }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  });
}

async function main() {
  const prisma = new PrismaClient();

  // ── Users (always upserted — safe to re-run) ────────────────────────────
  const seller1 = await prisma.user.upsert({
    where: { phone: "+15559990001" },
    create: { phone: "+15559990001", role: "seller", displayName: "Nova Sportswear", phoneVerifiedAt: new Date(), kybVerified: true },
    update: { kybVerified: true },
  });
  const seller2 = await prisma.user.upsert({
    where: { phone: "+15559990002" },
    create: { phone: "+15559990002", role: "seller", displayName: "Glow Beauty Co", phoneVerifiedAt: new Date(), kybVerified: true },
    update: { kybVerified: true },
  });

  const creatorNames = ["Ava Chen", "Marcus Lee", "Priya Patel", "Jonah Reyes", "Sofia Kim", "Diego Alvarez"];
  const creators = await Promise.all(
    creatorNames.map((name, i) =>
      prisma.user.upsert({
        where: { phone: `+155599901${String(i).padStart(2, "0")}` },
        create: {
          phone: `+155599901${String(i).padStart(2, "0")}`,
          role: "creator",
          displayName: name,
          phoneVerifiedAt: new Date(),
        },
        update: {},
      }),
    ),
  );
  const [ava, marcus, priya, jonah, sofia, diego] = creators;

  const alreadySeeded = await prisma.challenge.findFirst({
    where: { title: { startsWith: SEED_PREFIX } },
  });

  if (alreadySeeded) {
    // eslint-disable-next-line no-console
    console.log("Seed challenges already exist — skipping creation, just reprinting login tokens.\n");
  } else {
    // ── Challenge A: resolved, fully paid out ─────────────────────────────
    const prizePoolA = 50_000; // $500
    const breakdownA = computeFundingBreakdown(prizePoolA, 2000);
    const resolvedAt = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const challengeA = await prisma.challenge.create({
      data: {
        sellerId: seller1.id,
        title: `${SEED_PREFIX} Cold Brew Launch Reel`,
        brief: "15s reel introducing our new cold brew can — show it in your morning routine.",
        checklistCriteria: { maxDurationSeconds: 15 },
        prizePool: prizePoolA,
        stipendPool: breakdownA.stipendPool,
        takeRateBps: 2000,
        status: "resolved",
        resolvedAt,
      },
    });

    await prisma.round.createMany({
      data: [
        { challengeId: challengeA.id, roundNumber: 1, type: "peer_vote_teaser", status: "revealed", advanceCount: 4, opensAt: new Date(resolvedAt.getTime() - 3 * 86_400_000), closesAt: new Date(resolvedAt.getTime() - 2 * 86_400_000), revealedAt: new Date(resolvedAt.getTime() - 2 * 86_400_000) },
        { challengeId: challengeA.id, roundNumber: 2, type: "peer_vote_narrow", status: "revealed", advanceCount: 2, opensAt: new Date(resolvedAt.getTime() - 2 * 86_400_000), closesAt: new Date(resolvedAt.getTime() - 86_400_000), revealedAt: new Date(resolvedAt.getTime() - 86_400_000) },
        { challengeId: challengeA.id, roundNumber: 3, type: "public_vote_final", status: "revealed", advanceCount: 2, opensAt: new Date(resolvedAt.getTime() - 86_400_000), closesAt: resolvedAt, revealedAt: resolvedAt },
      ],
    });

    // Ava wins, Marcus is runner-up/crowd favourite, Priya & Jonah were
    // round-2 survivors (made full content, didn't reach the final).
    const [subAva, subMarcus, subPriya, subJonah] = await Promise.all([
      prisma.submission.create({ data: { creatorId: ava.id, challengeId: challengeA.id, phase: "full_content", status: "advanced", compositeScore: 0.91 } }),
      prisma.submission.create({ data: { creatorId: marcus.id, challengeId: challengeA.id, phase: "full_content", status: "advanced", compositeScore: 0.84 } }),
      prisma.submission.create({ data: { creatorId: priya.id, challengeId: challengeA.id, phase: "full_content", status: "eliminated", compositeScore: 0.71 } }),
      prisma.submission.create({ data: { creatorId: jonah.id, challengeId: challengeA.id, phase: "full_content", status: "eliminated", compositeScore: 0.68 } }),
    ]);

    const fakeQueue = { add: async () => undefined } as never;
    const fakeConfig = { get: () => undefined } as never;
    const stripe = new StripeService(fakeConfig);
    const fakeNotifications = { enqueue: async () => undefined } as never;
    const payouts = new PayoutsService(prisma as never, stripe, fakeNotifications);

    const survivorEach = Math.floor(breakdownA.survivorBonusPool / 2);
    await payouts.batchCreateAndTransfer(
      challengeA.id,
      [
        { userId: subAva.creatorId, type: "winner", amount: prizePoolA },
        { userId: subAva.creatorId, type: "stipend", amount: Math.floor(breakdownA.stipendPool / 2) },
        { userId: subMarcus.creatorId, type: "stipend", amount: Math.floor(breakdownA.stipendPool / 2) },
        { userId: subMarcus.creatorId, type: "crowd_favourite", amount: breakdownA.crowdFavourite },
        { userId: subPriya.creatorId, type: "survivor_bonus", amount: survivorEach },
        { userId: subJonah.creatorId, type: "survivor_bonus", amount: survivorEach },
      ],
      resolvedAt,
    );

    // Ratings, both directions.
    await prisma.rating.createMany({
      data: [
        { challengeId: challengeA.id, raterId: seller1.id, rateeId: ava.id, direction: "brand_to_creator", score: 5 },
        { challengeId: challengeA.id, raterId: seller1.id, rateeId: marcus.id, direction: "brand_to_creator", score: 4 },
        { challengeId: challengeA.id, raterId: ava.id, rateeId: seller1.id, direction: "creator_to_brand", score: 5 },
      ],
    });

    // A couple of real notification rows so /notifications has content.
    await prisma.notification.createMany({
      data: [
        { userId: ava.id, type: "payout", title: "🎉 You won: $500.00", body: `${challengeA.title} — $500.00 is on its way to your linked Stripe account.`, data: { challengeId: challengeA.id } },
        { userId: ava.id, type: "round_result", title: "🏆 Round 3 revealed", body: `Results are in for "${challengeA.title}" — round 3.`, data: { challengeId: challengeA.id } },
        { userId: marcus.id, type: "payout", title: "❤️ Crowd favourite bonus: " + `$${(breakdownA.crowdFavourite / 100).toFixed(2)}`, body: `${challengeA.title} — crowd favourite bonus is on its way.`, data: { challengeId: challengeA.id } },
      ],
    });

    // ── Challenge B: live peer-vote (round 1 open) ────────────────────────
    const challengeB = await prisma.challenge.create({
      data: {
        sellerId: seller1.id,
        title: `${SEED_PREFIX} Sneaker Drop Teaser`,
        brief: "Tease our weekend sneaker drop in 15s — street style, no studio lighting.",
        checklistCriteria: { maxDurationSeconds: 15 },
        prizePool: 40_000,
        stipendPool: 4_800,
        takeRateBps: 2000,
        status: "round1_open",
      },
    });
    const now = new Date();
    await prisma.round.create({
      data: {
        challengeId: challengeB.id,
        roundNumber: 1,
        type: "peer_vote_teaser",
        status: "open",
        advanceCount: 3,
        opensAt: now,
        closesAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    await prisma.submission.createMany({
      data: [ava, marcus, priya, jonah, sofia].map((c) => ({
        creatorId: c.id,
        challengeId: challengeB.id,
        phase: "teaser" as const,
        status: "pending" as const,
      })),
    });

    // ── Challenge C: draft, unfunded — test the funding flow ─────────────
    await prisma.challenge.create({
      data: {
        sellerId: seller2.id,
        title: `${SEED_PREFIX} Skincare Routine Challenge`,
        brief: "Show our new serum in your real morning or night routine — no scripts.",
        checklistCriteria: { maxDurationSeconds: 30, requiredHashtag: "#glowchallenge" },
        prizePool: 75_000,
        stipendPool: 9_000,
        takeRateBps: 2000,
        status: "draft",
      },
    });

    // ── Challenge D: live public vote (round 3 open) ──────────────────────
    const challengeD = await prisma.challenge.create({
      data: {
        sellerId: seller2.id,
        title: `${SEED_PREFIX} Neighborhood Coffee Crawl`,
        brief: "Full 60s piece: your favorite hidden coffee spot and why it's worth the trip.",
        checklistCriteria: { maxDurationSeconds: 60 },
        prizePool: 60_000,
        stipendPool: 7_200,
        takeRateBps: 2000,
        status: "round3_open",
      },
    });
    await prisma.round.create({
      data: {
        challengeId: challengeD.id,
        roundNumber: 3,
        type: "public_vote_final",
        status: "open",
        advanceCount: 3,
        opensAt: now,
        closesAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      },
    });
    await prisma.submission.createMany({
      data: [sofia, diego, priya].map((c) => ({
        creatorId: c.id,
        challengeId: challengeD.id,
        phase: "full_content" as const,
        status: "advanced" as const,
      })),
    });

    // ── Stories: one unclaimed, one claimed with content ──────────────────
    await prisma.story.create({
      data: {
        sellerId: seller2.id,
        title: `${SEED_PREFIX} Weekend Hike Vlog`,
        brief: "Free brief — film a weekend hike, any trail. No prize pool, just a byline and reach.",
        access: "FREE",
        mode: "OPEN",
      },
    });
    const storyF = await prisma.story.create({
      data: {
        sellerId: seller1.id,
        title: `${SEED_PREFIX} Morning Routine Tips`,
        brief: "Free brief — a quick morning-routine tips video featuring our gear, any style.",
        access: "FREE",
        mode: "OPEN",
      },
    });
    const claimF = await prisma.storyClaim.create({ data: { storyId: storyF.id, creatorId: diego.id } });
    const contentF = await prisma.content.create({
      data: { storyClaimId: claimF.id, mediaUrl: "https://example.com/media/morning-routine.mp4", caption: "5am gear check ☀️" },
    });
    await prisma.externalPost.create({
      data: { contentId: contentF.id, platform: "tiktok", url: "https://tiktok.com/@diego/video/123", views: 82_000, likes: 5_400 },
    });

    // Backfill Story rows for the Challenges just created (same logic as
    // scripts/backfill-stories.ts) so they show up linked, same as prod.
    const unlinked = await prisma.challenge.findMany({ where: { story: null }, select: { id: true, sellerId: true, title: true, brief: true } });
    await Promise.all(
      unlinked.map((c) =>
        prisma.story.create({
          data: { sellerId: c.sellerId, title: c.title, brief: c.brief, access: "PAID", mode: "CHALLENGE", challengeId: c.id },
        }),
      ),
    );

    // ── Referral: one pending ─────────────────────────────────────────────
    await prisma.referralReward.create({
      data: { referrerId: priya.id, refereeId: sofia.id }, // status defaults to pending
    });

    // eslint-disable-next-line no-console
    console.log("Seed data created:");
    // eslint-disable-next-line no-console
    console.log(`  Challenge A (resolved, paid out): ${challengeA.id}`);
    // eslint-disable-next-line no-console
    console.log(`  Challenge B (round1_open, live peer-vote): ${challengeB.id}`);
    // eslint-disable-next-line no-console
    console.log(`  Challenge D (round3_open, live public vote): ${challengeD.id}\n`);
  }

  // ── Print ready-to-use login tokens ───────────────────────────────────
  const tokenSeller = mintToken(seller1.id, seller1.phone);
  const tokenAva = mintToken(ava.id, ava.phone);

  // eslint-disable-next-line no-console
  console.log("Paste into the browser console on the web app to log in without OTP:\n");
  // eslint-disable-next-line no-console
  console.log(`// As seller "Nova Sportswear" (${seller1.phone}):`);
  // eslint-disable-next-line no-console
  console.log(`localStorage.setItem("moment.accessToken", "${tokenSeller}");\n`);
  // eslint-disable-next-line no-console
  console.log(`// As creator "Ava Chen" (${ava.phone}) — has a resolved win, a pending peer-vote entry, and a rally link:`);
  // eslint-disable-next-line no-console
  console.log(`localStorage.setItem("moment.accessToken", "${tokenAva}");`);

  await prisma.$disconnect();
}

main();
