import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Deck } from "@prisma/client";
import { PrismaService } from "../../common/prisma/prisma.service";
import { RoundStateMachineService } from "../rounds/round-state-machine.service";
import { generatePairs, insertAttentionCheck, Pair } from "./deck-generation";
import { StreakService } from "./streak.service";

const MIN_VIEW_DURATION_MS = 3000; // ADR-005 §4 vote-gate hardening

export interface CastPeerVoteResult {
  discarded: boolean;
  completed: boolean;
}

@Injectable()
export class DeckService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly stateMachine: RoundStateMachineService,
    private readonly streakService: StreakService,
  ) {}

  async generateDeck(userId: string, roundId: string): Promise<Deck> {
    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: roundId } });
    if (round.type === "public_vote_final") {
      throw new BadRequestException("This round uses public voting, not peer decks");
    }
    if (round.status !== "open" && round.status !== "closed") {
      throw new BadRequestException(`Round is ${round.status}; decks are no longer available`);
    }

    const existing = await this.prisma.deck.findUnique({
      where: { userId_roundId: { userId, roundId } },
    });
    if (existing && !existing.discarded) return existing;

    const phase = round.type === "peer_vote_teaser" ? "teaser" : "full_content";

    const voterSubmission = await this.prisma.submission.findFirst({
      where: { challengeId: round.challengeId, phase, creatorId: userId, status: "pending" },
    });
    if (!voterSubmission) {
      throw new ForbiddenException("Only creators with an active submission in this round can vote");
    }

    const eligible = await this.prisma.submission.findMany({
      where: {
        challengeId: round.challengeId,
        phase,
        status: "pending",
        creatorId: { not: userId },
      },
      select: { id: true },
    });
    if (eligible.length < 2) {
      throw new BadRequestException("Not enough eligible peer submissions to build a deck yet");
    }

    const gateThreshold = this.config.get<number>("rounds.participationGateVotes")!;
    const basePairs = generatePairs(
      eligible.map((s) => s.id),
      gateThreshold,
    );
    const { pairs, checkPairIndex } = insertAttentionCheck(basePairs);

    return this.prisma.deck.create({
      data: {
        userId,
        roundId,
        pairs: pairs as unknown as object,
        checkPairIndex,
      },
    });
  }

  async castVote(
    userId: string,
    deckId: string,
    pairIndex: number,
    winnerSubmissionId: string,
    viewDurationMs: number,
  ): Promise<CastPeerVoteResult> {
    if (viewDurationMs < MIN_VIEW_DURATION_MS) {
      throw new BadRequestException(
        `Must view the pair for at least ${MIN_VIEW_DURATION_MS}ms before picking`,
      );
    }

    const deck = await this.prisma.deck.findUniqueOrThrow({ where: { id: deckId } });
    if (deck.userId !== userId) throw new ForbiddenException("Not your deck");
    if (deck.discarded) throw new BadRequestException("This deck was discarded — request a new one");
    if (deck.completedAt) throw new BadRequestException("This deck is already complete");

    const pairs = deck.pairs as unknown as Pair[];
    const pair = pairs[pairIndex];
    if (!pair) throw new BadRequestException("pairIndex out of range");
    if (winnerSubmissionId !== pair.a && winnerSubmissionId !== pair.b) {
      throw new BadRequestException("winnerSubmissionId must be one side of the pair");
    }

    const round = await this.prisma.round.findUniqueOrThrow({ where: { id: deck.roundId } });
    const phase = round.type === "peer_vote_teaser" ? "teaser" : "full_content";
    const voterSubmission = await this.prisma.submission.findFirstOrThrow({
      where: { challengeId: round.challengeId, phase, creatorId: userId },
    });

    const loserSubmissionId = winnerSubmissionId === pair.a ? pair.b : pair.a;

    try {
      await this.prisma.peerVote.create({
        data: {
          roundId: deck.roundId,
          deckId: deck.id,
          pairIndex,
          voterUserId: userId,
          voterSubmissionId: voterSubmission.id,
          submissionId: winnerSubmissionId,
          loserSubmissionId,
        },
      });
    } catch {
      throw new BadRequestException("This pair was already answered");
    }

    // A cast vote resumes/extends the streak regardless of the later
    // attention-check outcome — the streak measures showing up to vote,
    // the attention check is a separate data-quality gate.
    await this.streakService.applyVoteForUser(userId);

    let discarded = false;
    if (pairIndex === deck.checkPairIndex) {
      discarded = !(await this.isConsistentWithSource(deck.id, pairs, deck.checkPairIndex, pair));
    }

    if (discarded) {
      await this.prisma.$transaction([
        this.prisma.peerVote.deleteMany({ where: { deckId: deck.id } }),
        this.prisma.deck.update({ where: { id: deck.id }, data: { discarded: true } }),
      ]);
      return { discarded: true, completed: false };
    }

    const answeredCount = await this.prisma.peerVote.count({ where: { deckId: deck.id } });
    const completed = answeredCount >= pairs.length;
    if (completed) {
      await this.prisma.deck.update({ where: { id: deck.id }, data: { completedAt: new Date() } });
    }

    await this.stateMachine.onPeerVoteCast(deck.roundId);

    return { discarded: false, completed };
  }

  private async isConsistentWithSource(
    deckId: string,
    pairs: Pair[],
    checkPairIndex: number,
    checkPair: Pair,
  ): Promise<boolean> {
    const sourceIndex = pairs.findIndex(
      (p, idx) => idx < checkPairIndex && p.a === checkPair.a && p.b === checkPair.b,
    );
    if (sourceIndex === -1) return true; // no source found — don't punish on a data anomaly

    const sourceVote = await this.prisma.peerVote.findUnique({
      where: { deckId_pairIndex: { deckId, pairIndex: sourceIndex } },
    });
    if (!sourceVote) return true; // source not yet answered — nothing to compare

    const checkVote = await this.prisma.peerVote.findUnique({
      where: { deckId_pairIndex: { deckId, pairIndex: checkPairIndex } },
    });
    if (!checkVote) return true;

    return sourceVote.submissionId === checkVote.submissionId;
  }
}
