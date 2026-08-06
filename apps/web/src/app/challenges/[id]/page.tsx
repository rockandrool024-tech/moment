"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, FundingResult, Round, RoundType } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { StripeFundForm } from "@/components/StripeFundForm";

const NEXT_ROUND_TYPE: Record<number, RoundType> = {
  1: "peer_vote_teaser",
  2: "peer_vote_narrow",
  3: "public_vote_final",
};

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [funding, setFunding] = useState<FundingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([
      api.get<Challenge>(`/challenges/${id}`),
      api.get<Round[]>(`/challenges/${id}/rounds`),
    ]);
    setChallenge(c);
    setRounds(r);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = user && challenge && user.id === challenge.sellerId;

  async function fund() {
    setError(null);
    setBusy(true);
    try {
      const result = await api.post<FundingResult>(`/challenges/${id}/fund`);
      setFunding(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function createNextRound() {
    setError(null);
    setBusy(true);
    try {
      const roundNumber = rounds.length + 1;
      const opensAt = new Date();
      const closesAt = new Date(opensAt.getTime() + 24 * 60 * 60 * 1000); // 24h round, adjust as needed
      await api.post(`/challenges/${id}/rounds`, {
        roundNumber,
        type: NEXT_ROUND_TYPE[roundNumber],
        advanceCount: roundNumber === 3 ? rounds.length : Math.max(2, 4 - roundNumber),
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString(),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!challenge) return <p className="muted">Loading…</p>;

  const canOpenNextRound =
    isOwner &&
    rounds.length < 3 &&
    ((rounds.length === 0 && challenge.status === "funded") ||
      (rounds.length > 0 && rounds[rounds.length - 1].status === "revealed"));

  return (
    <div>
      <h1>{challenge.title}</h1>
      <span className="badge">{challenge.status}</span>
      <p>{challenge.brief}</p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Prize breakdown</h2>
        <p>Pool: {formatCents(challenge.prizePool)}</p>
        <p>Stipend pool: {formatCents(challenge.stipendPool)}</p>
        <p className="muted">Take rate: {(challenge.takeRateBps / 100).toFixed(1)}%</p>
      </div>

      {!isOwner && (
        <Link href={`/challenges/${challenge.id}/submit`} className="btn">
          Submit an entry
        </Link>
      )}

      {isOwner && challenge.status === "draft" && !funding && (
        <button onClick={fund} disabled={busy}>
          Fund escrow
        </button>
      )}

      {funding && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Confirm funding</h2>
          <p className="muted">
            Total charge: {formatCents(funding.breakdown.totalCharge)} (pool{" "}
            {formatCents(funding.breakdown.prizePool)} + stipend{" "}
            {formatCents(funding.breakdown.stipendPool)} + survivor bonus{" "}
            {formatCents(funding.breakdown.survivorBonusPool)} + platform fee{" "}
            {formatCents(funding.breakdown.platformFee)})
          </p>
          <StripeFundForm
            clientSecret={funding.clientSecret}
            onDone={() => {
              setFunding(null);
              void load();
            }}
          />
        </div>
      )}

      {canOpenNextRound && (
        <button onClick={createNextRound} disabled={busy}>
          Open round {rounds.length + 1}
        </button>
      )}

      {error && <p className="error">{error}</p>}

      <h2>Rounds</h2>
      {rounds.length === 0 && <p className="muted">No rounds opened yet.</p>}
      {rounds.map((r) => (
        <Link key={r.id} href={`/rounds/${r.id}`} style={{ textDecoration: "none" }}>
          <div className="card">
            Round {r.roundNumber} — {r.type} <span className="badge">{r.status}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
