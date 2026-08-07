"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, ChallengeAnalytics } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

const PHASE_LABEL: Record<string, string> = {
  teaser: "Teaser",
  full_content: "Full content",
};

const ROUND_TYPE_LABEL: Record<string, string> = {
  peer_vote_teaser: "Peer vote (teaser)",
  peer_vote_narrow: "Peer vote (narrow)",
  public_vote_final: "Public vote (final)",
};

export default function ChallengeAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [analytics, setAnalytics] = useState<ChallengeAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const c = await api.get<Challenge>(`/challenges/${id}`);
      setChallenge(c);
      const a = await api.get<ChallengeAnalytics>(`/challenges/${id}/analytics`);
      setAnalytics(a);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  if (authLoading || !challenge) return <p className="muted">Loading…</p>;

  // Client-side UX only — the backend is the real ownership boundary and
  // returns a 403 for anyone else, which surfaces via `error` above.
  const isOwner = user && user.id === challenge.sellerId;
  if (!isOwner) {
    return <p className="error">Not authorized — only the campaign owner can view analytics.</p>;
  }

  return (
    <div>
      <h1>{challenge.title} — analytics</h1>
      <span className="badge">{challenge.status}</span>

      {error && <p className="error">{error}</p>}
      {!analytics && !error && <p className="muted">Loading analytics…</p>}

      {analytics && (
        <>
          <h2>Submission funnel</h2>
          {analytics.phases.map((p) => (
            <div key={p.phase} className="card">
              <h3 style={{ marginTop: 0 }}>{PHASE_LABEL[p.phase] ?? p.phase}</h3>
              <p>
                <strong>{p.submitted}</strong> submitted
              </p>
              <p className="muted">
                {p.advanced} advanced &middot; {p.eliminated} eliminated &middot; {p.pending} pending
              </p>
            </div>
          ))}

          <h2>Votes per round</h2>
          {analytics.rounds.length === 0 && <p className="muted">No rounds opened yet.</p>}
          {analytics.rounds.map((r) => (
            <div key={r.roundId} className="card">
              Round {r.roundNumber} — {ROUND_TYPE_LABEL[r.type] ?? r.type}{" "}
              <span className="badge">{r.votes} votes</span>
            </div>
          ))}

          <h2>Payouts</h2>
          {analytics.payouts.length === 0 && <p className="muted">No payouts issued yet.</p>}
          {analytics.payouts.map((p) => (
            <div key={p.type} className="card">
              <strong>{formatCents(p.totalAmount)}</strong> — {p.type.replace(/_/g, " ")}
              <div className="muted">{p.count} payout{p.count === 1 ? "" : "s"}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
