"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Deck } from "@/lib/types";

const MIN_VIEW_MS = 3000; // mirrors deck.service.ts's server-side gate

export function VoteDeck({ roundId }: { roundId: string }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pairStartedAt, setPairStartedAt] = useState<number>(Date.now());
  const [canPick, setCanPick] = useState(false);

  async function loadDeck() {
    setError(null);
    try {
      const d = await api.post<Deck>(`/rounds/${roundId}/decks`);
      setDeck(d);
      setAnsweredCount(0);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't build a deck yet");
    }
  }

  useEffect(() => {
    void loadDeck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  const currentPair = useMemo(
    () => (deck && !deck.discarded ? deck.pairs[answeredCount] : undefined),
    [deck, answeredCount],
  );

  useEffect(() => {
    if (!currentPair) return;
    setPairStartedAt(Date.now());
    setCanPick(false);
    const timer = setTimeout(() => setCanPick(true), MIN_VIEW_MS);
    return () => clearTimeout(timer);
  }, [currentPair]);

  async function pick(winnerSubmissionId: string) {
    if (!deck || !currentPair) return;
    setBusy(true);
    setError(null);
    try {
      const viewDurationMs = Date.now() - pairStartedAt;
      const result = await api.post<{ discarded: boolean; completed: boolean }>("/peer-votes", {
        deckId: deck.id,
        pairIndex: answeredCount,
        winnerSubmissionId,
        viewDurationMs,
      });
      if (result.discarded) {
        setError("Attention check failed — that deck was discarded. Starting a fresh one.");
        await loadDeck();
        return;
      }
      setAnsweredCount((n) => n + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Vote failed");
    } finally {
      setBusy(false);
    }
  }

  if (!deck) return <p className="muted">{error ?? "Loading your deck…"}</p>;

  if (!currentPair) {
    return <p>Deck complete — {answeredCount} votes cast. Waiting on the round to tally.</p>;
  }

  return (
    <div>
      <p className="muted">
        Pair {answeredCount + 1} of {deck.pairs.length}
        {answeredCount === deck.checkPairIndex && " (attention check)"}
      </p>
      <div className="pair-row">
        <div className="pair-option" onClick={() => canPick && !busy && pick(currentPair.a)}>
          Submission {currentPair.a.slice(0, 8)}
        </div>
        <div className="pair-option" onClick={() => canPick && !busy && pick(currentPair.b)}>
          Submission {currentPair.b.slice(0, 8)}
        </div>
      </div>
      {!canPick && <p className="muted">Watch for at least 3 seconds before picking…</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
