// Pure deck-building logic (blind pairwise decks, ADR-003 + ADR-005 vote-gate
// hardening). Kept dependency-free and unit-testable, same rationale as
// rounds/scoring.ts.

export interface Pair {
  a: string;
  b: string;
}

type Rng = () => number; // [0, 1)

function shuffled<T>(items: T[], rng: Rng): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Builds `count` distinct submission pairs from the eligible pool. Requires
 * at least 2 eligible submissions. Pairs favour covering the pool evenly
 * (round-robin over a shuffled order) before repeating any submission.
 */
export function generatePairs(submissionIds: string[], count: number, rng: Rng = Math.random): Pair[] {
  if (submissionIds.length < 2) {
    throw new Error("Need at least 2 eligible submissions to build a deck");
  }

  const pairs: Pair[] = [];
  let pool = shuffled(submissionIds, rng);
  let cursor = 0;

  while (pairs.length < count) {
    if (cursor + 1 >= pool.length) {
      pool = shuffled(submissionIds, rng);
      cursor = 0;
    }
    const a = pool[cursor];
    const b = pool[cursor + 1];
    cursor += 2;
    if (a !== b) pairs.push({ a, b });
  }

  return pairs;
}

/**
 * Inserts a repeat of an earlier pair at a random later position — the
 * attention check (ADR-005 §4). Returns the full deck (length = pairs.length
 * + 1) and the index the repeat landed at.
 */
export function insertAttentionCheck(
  pairs: Pair[],
  rng: Rng = Math.random,
): { pairs: Pair[]; checkPairIndex: number } {
  if (pairs.length === 0) {
    throw new Error("Cannot insert an attention check into an empty deck");
  }

  const sourceIndex = Math.floor(rng() * pairs.length);
  const repeatPair = { ...pairs[sourceIndex] };
  // Insert strictly after the source pair so it reads as "a repeat of an
  // earlier pair", never before it.
  const insertAt = sourceIndex + 1 + Math.floor(rng() * (pairs.length - sourceIndex));

  const withCheck = [...pairs.slice(0, insertAt), repeatPair, ...pairs.slice(insertAt)];
  return { pairs: withCheck, checkPairIndex: insertAt };
}

/**
 * The attention check passes iff the voter picked the same winner (by
 * position: 'a' or 'b') on the repeat pair as they did on its source. Since
 * we only keep the repeated pair's contents (not its source index) on the
 * deck, the caller supplies both answers directly.
 */
export function isAttentionCheckConsistent(
  originalWinner: "a" | "b",
  repeatWinner: "a" | "b",
): boolean {
  return originalWinner === repeatWinner;
}
