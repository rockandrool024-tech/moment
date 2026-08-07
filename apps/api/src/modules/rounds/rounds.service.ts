import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, ChallengeStatus, Round, RoundType } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { CreateRoundDto } from "./dto/create-round.dto";
import { SetFinalPickDto } from "./dto/set-final-pick.dto";
import { RoundStateMachineService } from "./round-state-machine.service";

const EXPECTED_CHALLENGE_STATUS_BY_ROUND: Record<number, ChallengeStatus> = {
  1: "funded",
  2: "round1_open",
  3: "round2_open",
};

const CHALLENGE_STATUS_FOR_ROUND: Record<number, ChallengeStatus> = {
  1: "round1_open",
  2: "round2_open",
  3: "round3_open",
};

const ROUND_TYPE_FOR_NUMBER: Record<number, RoundType> = {
  1: "peer_vote_teaser",
  2: "peer_vote_narrow",
  3: "public_vote_final",
};

// Fixed, not derived from a live submission count: at round-creation time
// (which is when a round *opens*), entries for that round haven't been
// submitted yet — round 1's teaser count is 0 the moment it's created, so
// deriving advanceCount from "how many exist right now" would almost always
// undercount. rankAndSelectAdvancers (scoring.ts) already advances everyone
// when advanceCount exceeds the actual field size, so a fixed cap is both
// simpler and correct regardless of how many entries actually show up.
const ADVANCE_COUNT_FOR_ROUND: Record<number, number> = {
  1: 12,
  2: 4,
  3: 4, // informational only — tallyPublicFinal doesn't cut anyone further
};

const AUTO_ROUND_DURATION_MS = 24 * 60 * 60 * 1000; // 24h default round length
const REVEAL_DEADLINE_MS = 2 * 60 * 60 * 1000; // ADR-003: 2h stall-prevention deadline

interface RoundParams {
  roundNumber: number;
  type: RoundType;
  advanceCount: number;
  opensAt: Date;
  closesAt: Date;
}

@Injectable()
export class RoundsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stateMachine: RoundStateMachineService,
  ) {}

  async create(challengeId: string, sellerId: string, dto: CreateRoundDto): Promise<Round> {
    await this.assertOwnerAndReady(challengeId, sellerId, dto.roundNumber);
    return this.createRound(challengeId, {
      roundNumber: dto.roundNumber,
      type: dto.type,
      advanceCount: dto.advanceCount,
      opensAt: new Date(dto.opensAt),
      closesAt: new Date(dto.closesAt),
    });
  }

  /**
   * Server-derives round params instead of trusting the client for
   * type/advanceCount/scheduling — the frontend previously computed these
   * itself, which meant business rules could drift from what the round
   * state machine actually expects. This is also what the Sprint 3 campaign
   * wizard builds on.
   */
  async createNext(challengeId: string, sellerId: string): Promise<Round> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException("Challenge not found");
    if (challenge.sellerId !== sellerId) {
      throw new ForbiddenException("Only the owning seller can open a round");
    }

    const previousRounds = await this.prisma.round.findMany({
      where: { challengeId },
      orderBy: { roundNumber: "desc" },
      take: 1,
    });
    const roundNumber = (previousRounds[0]?.roundNumber ?? 0) + 1;
    if (roundNumber > 3) {
      throw new ConflictException("This challenge already has all 3 rounds");
    }

    // challenge.status alone doesn't prove the *previous round* actually
    // revealed — it flips to e.g. 'round2_open' at round-2 creation and
    // stays there through round 2's whole open→closed→tallied→revealed
    // lifecycle, so it can't distinguish "round 2 is still running" from
    // "round 2 is done, ready for round 3." Check the round itself too.
    if (previousRounds[0] && previousRounds[0].status !== "revealed") {
      throw new ConflictException(
        `Round ${previousRounds[0].roundNumber} hasn't revealed yet (status: ${previousRounds[0].status})`,
      );
    }

    const expectedStatus = EXPECTED_CHALLENGE_STATUS_BY_ROUND[roundNumber];
    if (challenge.status !== expectedStatus) {
      throw new ConflictException(
        `Challenge must be '${expectedStatus}' to open round ${roundNumber} (currently '${challenge.status}') — ` +
          (roundNumber === 1 ? "has it been funded yet?" : "is the previous round revealed yet?"),
      );
    }

    const type = ROUND_TYPE_FOR_NUMBER[roundNumber];
    const opensAt = new Date();
    const closesAt = new Date(opensAt.getTime() + AUTO_ROUND_DURATION_MS);

    return this.createRound(challengeId, {
      roundNumber,
      type,
      advanceCount: ADVANCE_COUNT_FOR_ROUND[roundNumber],
      opensAt,
      closesAt,
    });
  }

  /**
   * Seller override for the round-3 winner (Sprint 3). Must land before the
   * round closes: tallyPublicFinal runs synchronously inside closeRound()
   * for public_vote_final (no participation gate to wait behind), so
   * 'open' is the only status this can ever apply to — same deadline the
   * vote itself is subject to, not a separate one.
   */
  async setFinalPick(roundId: string, sellerId: string, dto: SetFinalPickDto): Promise<Round> {
    const round = await this.prisma.round.findUnique({
      where: { id: roundId },
      include: { challenge: true },
    });
    if (!round) throw new NotFoundException("Round not found");
    if (round.challenge.sellerId !== sellerId) {
      throw new ForbiddenException("Only the owning seller can set the final pick");
    }
    if (round.type !== "public_vote_final") {
      throw new BadRequestException("Final pick only applies to the round-3 public vote");
    }
    if (round.status !== "open") {
      throw new ConflictException(`Round is ${round.status}; too late to set the final pick`);
    }

    // Round-3 finalists carry status "advanced" — round 2's tally set that
    // when they cleared peer_vote_narrow, and round 3 never creates a new
    // submission row (see tallyPublicFinal's matching query).
    const submission = await this.prisma.submission.findUnique({
      where: { id: dto.submissionId },
    });
    if (!submission || submission.challengeId !== round.challengeId || submission.status !== "advanced") {
      throw new BadRequestException("submissionId must be a live finalist in this round");
    }

    return this.prisma.round.update({
      where: { id: roundId },
      data: { finalPickSubmissionId: dto.submissionId },
    });
  }

  private async assertOwnerAndReady(
    challengeId: string,
    sellerId: string,
    roundNumber: number,
  ): Promise<void> {
    const challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    if (!challenge) throw new NotFoundException("Challenge not found");
    if (challenge.sellerId !== sellerId) {
      throw new ForbiddenException("Only the owning seller can open a round");
    }

    const expectedStatus = EXPECTED_CHALLENGE_STATUS_BY_ROUND[roundNumber];
    if (!expectedStatus) {
      throw new BadRequestException("roundNumber must be 1, 2, or 3");
    }
    if (challenge.status !== expectedStatus) {
      throw new BadRequestException(
        `Challenge must be '${expectedStatus}' to open round ${roundNumber} (currently '${challenge.status}')`,
      );
    }
  }

  private async createRound(challengeId: string, params: RoundParams): Promise<Round> {
    const revealDeadlineAt = new Date(params.closesAt.getTime() + REVEAL_DEADLINE_MS);

    let round: Round;
    try {
      round = await this.prisma.$transaction(async (tx) => {
        const created = await tx.round.create({
          data: {
            challengeId,
            roundNumber: params.roundNumber,
            type: params.type,
            advanceCount: params.advanceCount,
            opensAt: params.opensAt,
            closesAt: params.closesAt,
            revealDeadlineAt,
          },
        });
        await tx.challenge.update({
          where: { id: challengeId },
          data: { status: CHALLENGE_STATUS_FOR_ROUND[params.roundNumber] },
        });
        return created;
      });
    } catch (err) {
      // Two concurrent "open next round" calls both pass the read-time
      // checks above and race to insert — the @@unique([challengeId,
      // roundNumber]) constraint is the actual serialization point, and a
      // violation here means the loser should see a clean conflict, not a
      // raw 500.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ConflictException(`Round ${params.roundNumber} was just created by another request`);
      }
      throw err;
    }

    // Not transactional with the round insert above: if Redis/BullMQ is down
    // right after a successful commit, the round exists with no scheduled
    // close/reveal jobs. A "stuck round" detector (rounds past closesAt still
    // 'open', or past revealDeadlineAt still not 'revealed') belongs in the
    // Sprint 4 admin god-view to catch this — see production-app-scope.md's
    // "round-schedule repair" item.
    await this.stateMachine.scheduleRoundJobs(round);
    return round;
  }

  async findByIdOrThrow(id: string): Promise<Round> {
    const round = await this.prisma.round.findUnique({ where: { id } });
    if (!round) throw new NotFoundException("Round not found");
    return round;
  }

  findByChallenge(challengeId: string): Promise<Round[]> {
    return this.prisma.round.findMany({
      where: { challengeId },
      orderBy: { roundNumber: "asc" },
    });
  }
}
