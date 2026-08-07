"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, FundingResult, Round, Submission } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { previewCrowdFavourite, previewSurvivorBonusPool } from "@/lib/pricing-preview";
import { useAuth } from "@/lib/auth-context";
import { StripeFundForm } from "@/components/StripeFundForm";
import { RatingForm } from "@/components/RatingForm";
import { TrustStatsMini } from "@/components/TrustStatsMini";

interface RatingRow {
  rateeId: string;
}

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [funding, setFunding] = useState<FundingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [finalists, setFinalists] = useState<Submission[]>([]);
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [c, r] = await Promise.all([
      api.get<Challenge>(`/challenges/${id}`),
      api.get<Round[]>(`/challenges/${id}/rounds`),
    ]);
    setChallenge(c);
    setRounds(r);
    if (c.status === "resolved") {
      const [subs, mine] = await Promise.all([
        api.get<Submission[]>(`/submissions?challengeId=${id}&phase=full_content`),
        user ? api.get<RatingRow[]>(`/challenges/${id}/ratings/mine`) : Promise.resolve([]),
      ]);
      setFinalists(subs.filter((s) => s.status === "advanced"));
      setRatedIds(new Set(mine.map((r) => r.rateeId)));
    }
  }, [id, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const isOwner = user && challenge && user.id === challenge.sellerId;
  const needsKyb = isOwner && !user?.kybVerified;

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

  async function requestKyb() {
    setBusy(true);
    setError(null);
    try {
      await api.post("/users/me/request-kyb");
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function openNextRound() {
    setError(null);
    setBusy(true);
    try {
      // Server derives round number/type/advanceCount/scheduling — see
      // rounds.service.ts's createNext. The frontend just asks for "the next
      // round" and surfaces whatever conflict message comes back.
      await api.post(`/challenges/${id}/rounds/auto`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (!challenge) return <p className="muted">Loading…</p>;

  // Client-side affordance only (not authoritative) — the /rounds/auto
  // endpoint is the real source of truth and will reject with a clear
  // message if this guess is wrong (e.g. previous round not revealed yet).
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
        <p className="muted">
          Round-2 survivor bonus pool: {formatCents(previewSurvivorBonusPool(challenge.prizePool))}
          {" · "}
          Crowd favourite: {formatCents(previewCrowdFavourite(challenge.prizePool))}
        </p>
        <p className="muted">Take rate: {(challenge.takeRateBps / 100).toFixed(1)}%</p>
      </div>

      {!isOwner && (
        <Link href={`/challenges/${challenge.id}/submit`} className="btn">
          Submit an entry
        </Link>
      )}

      {needsKyb && challenge.status === "draft" && (
        <div className="card" style={{ borderColor: "#e8b93f" }}>
          <p style={{ margin: 0 }}>
            🔒 KYB verification required to fund challenges.{" "}
            <button className="secondary" onClick={requestKyb} disabled={busy}>
              Request verification
            </button>
          </p>
        </div>
      )}

      {isOwner && !needsKyb && challenge.status === "draft" && !funding && (
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
        <button onClick={openNextRound} disabled={busy}>
          Open round {rounds.length + 1}
        </button>
      )}

      {error && <p className="error">{error}</p>}

      {challenge.status === "resolved" && user && (
        <div>
          <h2>Rate</h2>
          {isOwner &&
            finalists.map((f) => (
              <RatingForm
                key={f.id}
                challengeId={challenge.id}
                rateeId={f.creatorId}
                label={`creator (entry ${f.id.slice(0, 8)})`}
                alreadyRated={ratedIds.has(f.creatorId)}
              />
            ))}
          {!isOwner && (
            <RatingForm
              challengeId={challenge.id}
              rateeId={challenge.sellerId}
              label="the brand"
              alreadyRated={ratedIds.has(challenge.sellerId)}
            />
          )}

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Brand trust stats</h3>
            <TrustStatsMini userId={challenge.sellerId} />
          </div>
        </div>
      )}

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
