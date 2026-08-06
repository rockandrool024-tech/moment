import {
  generatePairs,
  insertAttentionCheck,
  isAttentionCheckConsistent,
  Pair,
} from "./deck-generation";

// Deterministic sequence generator so tests are reproducible.
function sequenceRng(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("generatePairs", () => {
  it("throws with fewer than 2 eligible submissions", () => {
    expect(() => generatePairs(["only-one"], 8)).toThrow();
  });

  it("produces exactly `count` pairs", () => {
    const pairs = generatePairs(["a", "b", "c", "d"], 8, sequenceRng([0.1, 0.4, 0.9, 0.2]));
    expect(pairs).toHaveLength(8);
  });

  it("never pairs a submission with itself", () => {
    const pairs = generatePairs(["a", "b", "c"], 20, Math.random);
    for (const pair of pairs) {
      expect(pair.a).not.toBe(pair.b);
    }
  });

  it("only ever uses submissions from the eligible pool", () => {
    const pool = ["a", "b", "c", "d", "e"];
    const pairs = generatePairs(pool, 10, Math.random);
    for (const pair of pairs) {
      expect(pool).toContain(pair.a);
      expect(pool).toContain(pair.b);
    }
  });
});

describe("insertAttentionCheck", () => {
  it("throws on an empty deck", () => {
    expect(() => insertAttentionCheck([])).toThrow();
  });

  it("grows the deck by exactly one pair", () => {
    const pairs: Pair[] = [{ a: "1", b: "2" }, { a: "3", b: "4" }, { a: "5", b: "6" }];
    const { pairs: withCheck } = insertAttentionCheck(pairs, sequenceRng([0, 0]));
    expect(withCheck).toHaveLength(pairs.length + 1);
  });

  it("the inserted pair is an exact duplicate of an earlier pair", () => {
    const pairs: Pair[] = [{ a: "1", b: "2" }, { a: "3", b: "4" }, { a: "5", b: "6" }];
    const { pairs: withCheck, checkPairIndex } = insertAttentionCheck(pairs, sequenceRng([0, 0]));
    const inserted = withCheck[checkPairIndex];
    const matchesEarlierPair = withCheck
      .slice(0, checkPairIndex)
      .some((p) => p.a === inserted.a && p.b === inserted.b);
    expect(matchesEarlierPair).toBe(true);
  });

  it("always inserts strictly after the source pair, never before it", () => {
    for (let trial = 0; trial < 20; trial++) {
      const pairs: Pair[] = Array.from({ length: 8 }, (_, i) => ({
        a: `${i}-a`,
        b: `${i}-b`,
      }));
      const { pairs: withCheck, checkPairIndex } = insertAttentionCheck(pairs, Math.random);
      const inserted = withCheck[checkPairIndex];
      const sourceIndex = withCheck.findIndex(
        (p, idx) => idx < checkPairIndex && p.a === inserted.a && p.b === inserted.b,
      );
      expect(sourceIndex).toBeGreaterThanOrEqual(0);
      expect(sourceIndex).toBeLessThan(checkPairIndex);
    }
  });
});

describe("isAttentionCheckConsistent", () => {
  it("is consistent when the same side wins both times", () => {
    expect(isAttentionCheckConsistent("a", "a")).toBe(true);
    expect(isAttentionCheckConsistent("b", "b")).toBe(true);
  });

  it("is inconsistent when a different side wins", () => {
    expect(isAttentionCheckConsistent("a", "b")).toBe(false);
  });
});
