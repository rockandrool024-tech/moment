"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { Deck, Submission } from "@/lib/types";
import { CheckIcon, FilmIcon, VerifiedIcon, VoteCheckIcon } from "@/components/icons";
import { Notice } from "@/components/Notice";
import { CardSkeletonList } from "@/components/Skeleton";
import styles from "./VoteDeck.module.css";

const MIN_VIEW_MS = 3000;

export function VoteDeck({ roundId, challengeId }: { roundId: string; challengeId: string }) {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pairStartedAt, setPairStartedAt] = useState<number>(Date.now());
  const [canPick, setCanPick] = useState(false);

  const loadDeck = useCallback(async () => {
    setError(null);
    try {
      const [nextDeck, allSubmissions] = await Promise.all([
        api.post<Deck>(`/rounds/${roundId}/decks`),
        api.get<Submission[]>(`/submissions?challengeId=${challengeId}`),
      ]);
      setDeck(nextDeck);
      setSubmissions(allSubmissions);
      setAnsweredCount(0);
      setSelected(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "A voting deck isn’t ready yet.");
    }
  }, [challengeId, roundId]);

  useEffect(() => { void loadDeck(); }, [loadDeck]);

  const currentPair = useMemo(() => deck && !deck.discarded ? deck.pairs[answeredCount] : undefined, [deck, answeredCount]);
  const submissionMap = useMemo(() => new Map(submissions.map((submission) => [submission.id, submission])), [submissions]);
  const pairSubmissions = currentPair ? [submissionMap.get(currentPair.a), submissionMap.get(currentPair.b)] : [];
  const contentReady = pairSubmissions.length === 2 && pairSubmissions.every((submission) => Boolean(submission?.playbackId));

  useEffect(() => {
    if (!currentPair) return;
    setPairStartedAt(Date.now());
    setCanPick(false);
    setSelected(null);
    const timer = setTimeout(() => setCanPick(true), MIN_VIEW_MS);
    return () => clearTimeout(timer);
  }, [currentPair]);

  async function confirmPick() {
    if (!selected || !deck || !currentPair || !canPick || !contentReady) return;
    setBusy(true);
    setError(null);
    try {
      const viewDurationMs = Date.now() - pairStartedAt;
      const result = await api.post<{ discarded: boolean; completed: boolean }>("/peer-votes", {
        deckId: deck.id,
        pairIndex: answeredCount,
        winnerSubmissionId: selected,
        viewDurationMs,
      });
      if (result.discarded) {
        setError("That deck didn’t pass the attention check, so it won’t affect the result. A fresh deck is ready.");
        await loadDeck();
        return;
      }
      setAnsweredCount((count) => count + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your vote wasn’t saved. Try once more.");
    } finally {
      setBusy(false);
    }
  }

  if (!deck) {
    return error ? <Notice tone="danger" title="Voting is unavailable" action={<button className="secondary" onClick={() => void loadDeck()}>Try again</button>}>{error}</Notice> : <CardSkeletonList count={2} media />;
  }

  if (!currentPair) {
    return (
      <section className={`card ${styles.complete}`}>
        <span className={styles.completeIcon}><VoteCheckIcon width={28} height={28} aria-hidden /></span>
        <span className="page-eyebrow">Deck complete</span>
        <h2>{answeredCount} votes counted.</h2>
        <p className="muted">Your result unlocks when the round is tallied. Every completed deck helps the strongest work rise.</p>
      </section>
    );
  }

  const total = deck.pairs.length;
  const remaining = Math.max(total - answeredCount, 0);

  return (
    <div className={styles.deck}>
      <div className={styles.progressHead}>
        <strong>{answeredCount + 1} of {total} votes</strong>
        <span>{remaining} remaining</span>
      </div>
      <div className="progress-track" role="progressbar" aria-label="Vote deck progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={answeredCount}>
        <div className="progress-fill" style={{ width: `${(answeredCount / total) * 100}%` }} />
      </div>
      <p className={styles.unlock}>{remaining === 1 ? "One more vote unlocks your result." : `${remaining} more votes unlock your result.`}</p>

      {!contentReady && <Notice tone="warning" title="These videos aren’t playable yet">Voting stays disabled until both submissions have finished processing. Refresh in a moment.</Notice>}

      <div className={styles.pair}>
        {currentPair && [currentPair.a, currentPair.b].map((submissionId, index) => {
          const submission = submissionMap.get(submissionId);
          const isSelected = selected === submissionId;
          return (
            <article className={`${styles.option} ${isSelected ? styles.optionSelected : ""}`} key={submissionId}>
              <div className={styles.videoWrap}>
                {submission?.playbackId ? (
                  <video className={styles.video} src={`https://stream.mux.com/${submission.playbackId}/high.mp4`} controls playsInline preload="metadata" />
                ) : (
                  <div className={styles.placeholder}><div className={styles.placeholderInner}><FilmIcon width={28} height={28} aria-hidden /><span>Video processing</span></div></div>
                )}
                {isSelected && <span className={styles.selectedMark}><CheckIcon width={18} height={18} aria-hidden /></span>}
              </div>
              <div className={styles.optionCopy}>
                <strong>Option {index === 0 ? "A" : "B"}</strong>
                <span>Creator identity hidden until reveal</span>
              </div>
              <button type="button" className="secondary btn-block" disabled={!canPick || busy || !submission?.playbackId} onClick={() => setSelected(submissionId)}>
                {isSelected ? "Selected" : canPick ? `Choose ${index === 0 ? "A" : "B"}` : "Watch first"}
              </button>
            </article>
          );
        })}
        <span className={styles.vs}>VS</span>
      </div>

      <div className={styles.footer}>
        <p className={styles.help}><VerifiedIcon width={14} height={14} aria-hidden /> Watch both for at least three seconds. You won’t see who made them.</p>
        <span className={styles.attention}>Stay sharp — one pair repeats to protect vote quality.</span>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn-block" disabled={!selected || !canPick || busy || !contentReady} onClick={() => void confirmPick()}>
          {busy ? "Saving your pick…" : "Lock my pick"}
        </button>
      </div>
    </div>
  );
}
