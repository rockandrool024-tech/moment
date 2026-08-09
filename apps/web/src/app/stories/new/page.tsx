"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Story } from "@/lib/types";

// Every Story created here is FREE/OPEN — a funded, competitive brief is
// created via /challenges/new instead (see StoriesService.create).
export default function NewStoryPage() {
  const [title, setTitle] = useState("");
  const [brief, setBrief] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const story = await api.post<Story>("/stories", { title, brief });
      router.push(`/stories/${story.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1>New story</h1>
      <p className="muted">
        Free for creators to claim — no escrow, no prize pool. Want a funded, competitive brief
        instead? Create a <a href="/challenges/new">Challenge</a>.
      </p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="brief">Brief</label>
          <textarea id="brief" rows={4} value={brief} onChange={(e) => setBrief(e.target.value)} required />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit" className="btn-block" disabled={busy}>
          Create story
        </button>
      </form>
    </div>
  );
}
