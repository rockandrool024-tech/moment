"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge } from "@/lib/types";
import { dollarsToCents } from "@/lib/format";

export default function NewChallengePage() {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [prizeDollars, setPrizeDollars] = useState(500);
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(15);
  const [requiredHashtag, setRequiredHashtag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const challenge = await api.post<Challenge>("/challenges", {
        title,
        brief,
        prizePool: dollarsToCents(prizeDollars),
        checklistCriteria: {
          maxDurationSeconds: maxDurationSeconds || undefined,
          requiredHashtag: requiredHashtag || undefined,
        },
      });
      router.push(`/challenges/${challenge.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>New challenge</h1>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="brief">Brief</label>
          <textarea
            id="brief"
            rows={4}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="prize">Prize pool (USD)</label>
          <input
            id="prize"
            type="number"
            min={1}
            value={prizeDollars}
            onChange={(e) => setPrizeDollars(Number(e.target.value))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="maxDuration">Round-1 teaser max duration (seconds)</label>
          <input
            id="maxDuration"
            type="number"
            min={1}
            value={maxDurationSeconds}
            onChange={(e) => setMaxDurationSeconds(Number(e.target.value))}
          />
        </div>
        <div className="field">
          <label htmlFor="hashtag">Required hashtag (optional)</label>
          <input
            id="hashtag"
            value={requiredHashtag}
            onChange={(e) => setRequiredHashtag(e.target.value)}
            placeholder="#momentchallenge"
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={busy}>
          Create (as draft)
        </button>
      </form>
    </div>
  );
}
