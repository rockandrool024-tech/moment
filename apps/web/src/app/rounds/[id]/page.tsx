"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Round, Submission } from "@/lib/types";
import { VoteDeck } from "@/components/VoteDeck";

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

      {round.status === "revealed" && <p>This round has been revealed — results are final.</p>}

      {round.status !== "revealed" &&
        (round.type === "public_vote_final" ? (
          <PublicVote round={round} />
        ) : (
          <VoteDeck roundId={round.id} />
        ))}
    </div>
  );
}
