/**
 * Regression check for the round-3 finalists bug: tallyPublicFinal used to
 * query `status: "pending"` for full_content finalists, but round 2's own
 * tally (tallyPeerVoteRound) already flips them to "advanced" — so the
 * query always returned zero rows and the winner/stipend/crowd_favourite
 * payout block never ran. Fixed in round-state-machine.service.ts.
 *
 * This seeds the exact DB state round 3 sees after round 2 resolves, runs
 * the real RoundStateMachineService.closeRound() against it, and asserts a
 * winner Payout row actually gets created. Cleans up everything it creates.
 *
 * Usage: pnpm --filter @moment/api exec ts-node -T scripts/verify-round3-payout.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { RoundStateMachineService } from "../src/modules/rounds/round-state-machine.service";
import { PayoutsService } from "../src/modules/payments/payouts.service";
import { StripeService } from "../src/modules/payments/stripe.service";

async function main() {
  const prisma = new PrismaClient();

  // Minimal stand-ins for the Nest DI graph this needs — no BullMQ/Stripe
  // network calls happen on this path (see rationale below), so plain
  // no-op stubs are enough rather than a full TestingModule.
  const fakeQueue = { add: async () => undefined } as never;
  const fakeConfig = { get: () => undefined } as never; // tallyPublicFinal's path never reads config
  const stripe = new StripeService(fakeConfig); // .get() is lazy; never invoked below
  const payouts = new PayoutsService(prisma as never, stripe);
  const fakeNotifications = { enqueue: async () => undefined } as never;
  const stateMachine = new RoundStateMachineService(
    fakeQueue,
    prisma as never,
    fakeConfig,
    payouts,
    fakeNotifications,
  );

  const suffix = Date.now();
  const seller = await prisma.user.create({
    data: { role: "seller", phone: `+1555${suffix}0`, displayName: "Verify Seller" },
  });
  const creators = await Promise.all(
    ["A", "B", "C"].map((label, i) =>
      prisma.user.create({
        data: { role: "creator", phone: `+1555${suffix}${i + 1}`, displayName: `Verify Creator ${label}` },
        // Deliberately no stripeConnectAccountId — PayoutsService.transferOne
        // early-returns (leaves the payout "pending") rather than calling
        // Stripe, which is exactly what we want for an offline check.
      }),
    ),
  );

  const challenge = await prisma.challenge.create({
    data: {
      sellerId: seller.id,
      title: "Verify Round 3 Payout",
      brief: "internal check",
      checklistCriteria: {},
      prizePool: 500_000,
      stipendPool: 60_000,
      takeRateBps: 1000,
      status: "round3_open",
    },
  });

  const now = new Date();
  const round = await prisma.round.create({
    data: {
      challengeId: challenge.id,
      roundNumber: 3,
      type: "public_vote_final",
      status: "open",
      advanceCount: 3,
      opensAt: new Date(now.getTime() - 60_000),
      closesAt: new Date(now.getTime() - 1000), // already past — closeRound will tally immediately
    },
  });

  // Finalists carry status "advanced" — this is the exact state the bug
  // failed to find (it queried "pending" instead).
  const submissions = await Promise.all(
    creators.map((c) =>
      prisma.submission.create({
        data: { creatorId: c.id, challengeId: challenge.id, phase: "full_content", status: "advanced" },
      }),
    ),
  );

  // Creator A gets the most quality votes — should win.
  const [winnerVoterA, winnerVoterB] = await Promise.all([
    prisma.user.create({ data: { role: "creator", phone: `+1555${suffix}9` } }),
    prisma.user.create({ data: { role: "creator", phone: `+1555${suffix}8` } }),
  ]);
  await prisma.vote.createMany({
    data: [
      { roundId: round.id, voterId: winnerVoterA.id, submissionId: submissions[0].id, pool: "quality" },
      { roundId: round.id, voterId: winnerVoterB.id, submissionId: submissions[0].id, pool: "quality" },
    ],
  });

  let pass = false;
  try {
    await stateMachine.closeRound(round.id);

    const winnerPayouts = await prisma.payout.findMany({
      where: { challengeId: challenge.id, type: "winner" },
    });
    const stipendPayouts = await prisma.payout.findMany({
      where: { challengeId: challenge.id, type: "stipend" },
    });

    pass =
      winnerPayouts.length === 1 &&
      winnerPayouts[0].userId === creators[0].id &&
      winnerPayouts[0].amount === challenge.prizePool &&
      stipendPayouts.length === submissions.length;

    // eslint-disable-next-line no-console
    console.log(
      pass
        ? "PASS — round-3 tally found finalists and created the winner payout correctly."
        : "FAIL — round-3 tally did not produce the expected payouts.",
      { winnerPayouts, stipendPayouts },
    );
  } finally {
    // Clean up everything this script created, in FK-safe order.
    await prisma.payout.deleteMany({ where: { challengeId: challenge.id } });
    await prisma.vote.deleteMany({ where: { roundId: round.id } });
    await prisma.submission.deleteMany({ where: { challengeId: challenge.id } });
    await prisma.round.deleteMany({ where: { challengeId: challenge.id } });
    await prisma.challenge.delete({ where: { id: challenge.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [seller.id, ...creators.map((c) => c.id), winnerVoterA.id, winnerVoterB.id] } },
    });
    await prisma.$disconnect();
  }

  process.exit(pass ? 0 : 1);
}

main();
