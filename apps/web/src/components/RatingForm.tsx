"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api-client";
import { StarRating } from "./StarRating";

export function RatingForm({
  challengeId,
  rateeId,
  label,
  alreadyRated = false,
}: {
  challengeId: string;
  rateeId: string;
  label: string;
  alreadyRated?: boolean;
}) {
  const [submitted, setSubmitted] = useState(alreadyRated);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(score: number) {
    setBusy(true);
    setError(null);
    try {
      await api.post("/ratings", { challengeId, rateeId, score });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't submit rating");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) return <p className="muted">✓ Rated {label}.</p>;

  return (
    <div className="card sheet-rise">
      <p style={{ marginTop: 0 }}>Rate {label}</p>
      <StarRating value={0} onRate={submit} />
      {busy && <p className="muted">Submitting…</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
