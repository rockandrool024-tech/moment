"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, Round, Submission } from "@/lib/types";
import { VoteDeck } from "@/components/VoteDeck";
import { getRallyCode } from "@/lib/rally";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeftIcon, CheckIcon, FilmIcon, ShareIcon, VoteCheckIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { CardSkeletonList } from "@/components/Skeleton";
import styles from "./round.module.css";

function roundTypeLabel(type: Round["type"]) {
  if (type === "peer_vote_teaser") return "Blind teaser vote";
  if (type === "peer_vote_narrow") return "Blind full-content vote";
  return "Public final";
}

function ShareResultLink({ challengeId }: { challengeId: string }) {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (!user) return;
    api.get<Submission[]>(`/submissions?challengeId=${challengeId}&creatorId=${user.id}`).then((all) => setSubmission(all[all.length - 1] ?? null)).catch(() => undefined);
  }, [user, challengeId]);

  if (!submission) return null;
  return <Link href={`/results/${submission.id}`} className="btn"><ShareIcon width={16} height={16} aria-hidden />Share your result</Link>;
}

async function attributeRallyIfPresent(campaignId: string): Promise<void> {
  const code = getRallyCode();
  if (!code) return;
  try {
    const { creatorId } = await api.get<{ creatorId: string; challengeId: string }>(`/rally/${code}/resolve`);
    await api.post("/rally-attributions", { creatorId, campaignId });
  } catch { /* attribution never blocks voting */ }
}

function SellerFinalPick({ round }: { round: Round }) {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [finalists, setFinalists] = useState<Submission[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(round.finalPickSubmissionId);

  useEffect(() => {
    api.get<Challenge>(`/challenges/${round.challengeId}`).then(setChallenge).catch(() => undefined);
    api.get<Submission[]>(`/submissions?challengeId=${round.challengeId}&phase=full_content`).then((all) => setFinalists(all.filter((submission) => submission.status === "advanced"))).catch(() => undefined);
  }, [round.challengeId]);

  if (!user || !challenge || user.id !== challenge.sellerId || round.status !== "open") return null;

  async function pick(submissionId: string) {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/rounds/${round.id}/final-pick`, { submissionId });
      setSaved(submissionId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your final pick couldn’t be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <span className="page-eyebrow">Brand decision</span>
      <h2>Your final call is optional.</h2>
      <p className="muted">Choose the winner directly, or leave this untouched and let verified quality votes decide.</p>
      <div className={styles.pickList}>
        {finalists.map((finalist, index) => (
          <div className={styles.pickRow} key={finalist.id}>
            <span>Finalist {index + 1} · entry {finalist.id.slice(0, 8)}</span>
            {saved === finalist.id ? <span className="badge badge-accent"><CheckIcon width={13} height={13} aria-hidden />Your pick</span> : <button className="secondary" disabled={busy} onClick={() => void pick(finalist.id)}>Pick winner</button>}
          </div>
        ))}
      </div>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}

function PublicVote({ round }: { round: Round }) {
  const [finalists, setFinalists] = useState<Submission[] | null>(null);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const all = await api.get<Submission[]>(`/submissions?challengeId=${round.challengeId}&phase=full_content`);
      setFinalists(all.filter((submission) => submission.status === "advanced"));
    } catch {
      setFinalists([]);
      setError("Finalists couldn’t be loaded. Try again before the vote closes.");
    }
  }, [round.challengeId]);

  useEffect(() => { void load(); }, [load]);

  async function vote(submissionId: string) {
    setBusy(true);
    setError(null);
    try {
      await attributeRallyIfPresent(round.challengeId);
      await api.post(`/rounds/${round.id}/votes`, { submissionId });
      setVotedFor(submissionId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Your vote wasn’t saved.");
    } finally {
      setBusy(false);
    }
  }

  if (finalists === null) return <CardSkeletonList count={2} media />;
  if (finalists.length === 0) return <EmptyState icon={<FilmIcon width={28} height={28} aria-hidden />} title="No finalists yet" body="The final four appear here once the previous round closes and the votes are tallied." />;

  return (
    <section>
      <div className="section-header"><div><h2>Choose the strongest final piece</h2><p>One verified audience vote. Creator identities stay secondary to the work.</p></div></div>
      {votedFor && <Notice tone="success" title="Your final vote is in">Thanks for judging the work. Return when the round closes to see the winner.</Notice>}
      {error && <Notice tone="danger" title="Vote not saved" action={<button className="secondary" onClick={() => setError(null)}>Dismiss</button>}>{error}</Notice>}
      <div className={styles.finalGrid}>
        {finalists.map((finalist, index) => (
          <article className={`card ${styles.finalCard}`} key={finalist.id}>
            <div className={styles.finalMedia}>
              {finalist.playbackId ? <video src={`https://stream.mux.com/${finalist.playbackId}/high.mp4`} controls playsInline preload="metadata" /> : <div className={styles.finalPlaceholder}><FilmIcon width={30} height={30} aria-hidden /></div>}
            </div>
            <div className={styles.finalBody}>
              <div className={styles.finalTop}><strong>Finalist {index + 1}</strong>{votedFor === finalist.id && <span className="badge badge-accent">Your vote</span>}</div>
              <button className="btn-block" disabled={busy || Boolean(votedFor) || !finalist.playbackId} onClick={() => void vote(finalist.id)}>
                {!finalist.playbackId ? "Video processing" : votedFor === finalist.id ? "Vote recorded" : "Vote for this piece"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function RoundPage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoadError(false);
    setRound(null);
    api.get<Round>(`/rounds/${id}`).then(setRound).catch(() => setLoadError(true));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (!round) {
    return <div className={styles.loading}>{loadError ? <Notice tone="danger" title="Round unavailable" action={<button className="secondary" onClick={load}>Retry</button>}>We couldn’t load this vote.</Notice> : <CardSkeletonList count={2} media />}</div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <Link href={`/challenges/${round.challengeId}`} className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />Back to challenge</Link>
          <h1 className={styles.title}>Round {round.roundNumber} · {roundTypeLabel(round.type)}</h1>
          <div className={styles.headerMeta}><span className={round.status === "open" ? "badge badge-live" : "badge"}>{round.status}</span><span>{round.advanceCount} advance from this round</span></div>
        </div>
      </header>

      {round.status === "revealed" ? (
        <section className={`card ${styles.revealed}`}>
          <span className={styles.revealIcon}><VoteCheckIcon width={30} height={30} aria-hidden /></span>
          <span className="page-eyebrow">Round revealed</span>
          <h2>The result is final.</h2>
          <p className="muted">Your share card turns the outcome into a clean link for supporters, clients and future collaborators.</p>
          <ShareResultLink challengeId={round.challengeId} />
        </section>
      ) : round.type === "public_vote_final" ? (
        <>
          <SellerFinalPick round={round} />
          <PublicVote round={round} />
        </>
      ) : (
        <VoteDeck roundId={round.id} challengeId={round.challengeId} />
      )}
    </div>
  );
}
