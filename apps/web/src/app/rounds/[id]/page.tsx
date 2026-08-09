"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, Round, Submission } from "@/lib/types";
import { VoteDeck } from "@/components/VoteDeck";
import { getRallyCode } from "@/lib/rally";
import { useAuth } from "@/lib/auth-context";
import { ShareIcon } from "@/components/icons";

function ShareResultLink({ challengeId }: { challengeId: string }) {
  const { user } = useAuth();
  const [submission, setSubmission] = useState<Submission | null>(null);

  useEffect(() => {
    if (!user) return;
    api
      .get<Submission[]>(`/submissions?challengeId=${challengeId}&creatorId=${user.id}`)
      .then((all) => setSubmission(all[all.length - 1] ?? null));
  }, [user, challengeId]);

  if (!submission) return null;

  return (
    <p style={{ marginTop: "1rem" }}>
      <Link
        href={`/results/${submission.id}`}
        className="btn"
        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
      >
        <ShareIcon width={16} height={16} aria-hidden /> Share your result
      </Link>
    </p>
  );
}

// Best-effort: if this visitor arrived via a creator's rally link
// (RallyCapture on the /battle page stored the code), attribute them before
// their vote is cast. Attribution is by the *rallying* creator, not by
// whoever they end up voting for (ADR-005 §1) — failure here never blocks
// the vote itself, it just means growth-viral-mechanics.md's rally loop
// doesn't get credit for this particular voter.
async function attributeRallyIfPresent(campaignId: string): Promise<void> {
  const code = getRallyCode();
  if (!code) return;
  try {
    const { creatorId } = await api.get<{ creatorId: string; challengeId: string }>(
      `/rally/${code}/resolve`,
    );
    await api.post("/rally-attributions", { creatorId, campaignId });
  } catch {
    // No-op — see rationale above.
  }
}

// Seller-only override for the round-3 winner. Purely additive — the vote
// itself still runs and still decides if the seller never touches this
// (rounds.service.ts falls back to the top quality-vote finalist).
function SellerFinalPick({ round }: { round: Round }) {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [finalists, setFinalists] = useState<Submission[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(round.finalPickSubmissionId);

  useEffect(() => {
    api.get<Challenge>(`/challenges/${round.challengeId}`).then(setChallenge);
    api
      .get<Submission[]>(`/submissions?challengeId=${round.challengeId}&phase=full_content`)
      .then((all) => setFinalists(all.filter((s) => s.status === "advanced")));
  }, [round.challengeId]);

  if (!user || !challenge || user.id !== challenge.sellerId || round.status !== "open") return null;

  async function pick(submissionId: string) {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/rounds/${round.id}/final-pick`, { submissionId });
      setSaved(submissionId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>Final pick (optional)</h2>
      <p className="muted">
        Override the crowd vote and choose the winner yourself. If you never set this, the
        finalist with the most quality votes wins automatically.
      </p>
      {finalists.map((f) => (
        <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Submission {f.id.slice(0, 8)}</span>
          {saved === f.id ? (
            <span className="badge">your pick</span>
          ) : (
            <button className="secondary" disabled={busy} onClick={() => pick(f.id)}>
              Pick as winner
            </button>
          )}
        </div>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

function PublicVote({ round }: { round: Round }) {
  const [finalists, setFinalists] = useState<Submission[]>([]);
  const [votedFor, setVotedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const all = await api.get<Submission[]>(
      `/submissions?challengeId=${round.challengeId}&phase=full_content`,
    );
    setFinalists(all.filter((s) => s.status === "advanced"));
  }, [round.challengeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function vote(submissionId: string) {
    setBusy(true);
    setError(null);
    try {
      await attributeRallyIfPresent(round.challengeId);
      await api.post(`/rounds/${round.id}/votes`, { submissionId });
      setVotedFor(submissionId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Vote failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h2>Finalists</h2>
      {finalists.length === 0 && <p className="muted">No finalists yet.</p>}
      {finalists.map((f) => (
        <div key={f.id} className="card">
          Submission {f.id.slice(0, 8)}{" "}
          {votedFor === f.id ? (
            <span className="badge">your vote</span>
          ) : (
            <button disabled={busy || !!votedFor} onClick={() => vote(f.id)}>
              Vote
            </button>
          )}
        </div>
      ))}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default function RoundPage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<Round | null>(null);

  useEffect(() => {
    api.get<Round>(`/rounds/${id}`).then(setRound);
  }, [id]);

  if (!round) return <p className="muted">Loading…</p>;

  return (
    <div>
      <h1>
        Round {round.roundNumber} <span className="badge">{round.status}</span>
      </h1>
      <p className="muted">{round.type}</p>

      {round.status === "revealed" && (
        <>
          <p>This round has been revealed — results are final.</p>
          <ShareResultLink challengeId={round.challengeId} />
        </>
      )}

      {round.status !== "revealed" &&
        (round.type === "public_vote_final" ? (
          <>
            <SellerFinalPick round={round} />
            <PublicVote round={round} />
          </>
        ) : (
          <VoteDeck roundId={round.id} />
        ))}
    </div>
  );
}
