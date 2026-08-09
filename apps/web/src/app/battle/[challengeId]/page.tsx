import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { PublicChallengeSummary, PublicTally } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { RallyCapture } from "@/components/RallyCapture";

async function loadSummary(challengeId: string) {
  return api.get<PublicChallengeSummary>(`/public/challenges/${challengeId}`);
}

export async function generateMetadata({
  params,
}: {
  params: { challengeId: string };
}): Promise<Metadata> {
  const summary = await loadSummary(params.challengeId);
  return {
    title: `${summary.title} — ${formatCents(summary.prizePool)} on the line | Perokio`,
    description: summary.brief,
  };
}

// Public, no-login spectator page — ADR-002's "highest-leverage decision...
// for actual virality." Server-rendered so a shared link unfurls instantly.
export default async function BattlePage({
  params,
  searchParams,
}: {
  params: { challengeId: string };
  searchParams: { rally?: string };
}) {
  const summary = await loadSummary(params.challengeId);
  const tally = summary.currentRound
    ? await api.get<PublicTally>(`/public/challenges/${params.challengeId}/tally`)
    : null;

  return (
    <div>
      <RallyCapture code={searchParams.rally} />
      <h1>{summary.title}</h1>
      <p>
        <strong>{formatCents(summary.prizePool)}</strong> prize pool ·{" "}
        <span className="badge">{summary.status}</span>
      </p>
      <p>{summary.brief}</p>

      {summary.currentRound && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>
            Round {summary.currentRound.roundNumber} —{" "}
            <span className="badge">{summary.currentRound.status}</span>
          </h2>
          <p className="muted">{summary.currentRound.type}</p>

          {tally?.visible ? (
            <>
              <h3>Live tally</h3>
              {tally.tallies.length === 0 && <p className="muted">No votes yet.</p>}
              {tally.tallies.map((t) => (
                <div key={t.submissionId}>
                  Submission {t.submissionId.slice(0, 8)} — {t.votes} votes
                </div>
              ))}
            </>
          ) : (
            <p className="muted">Voting is blind — results reveal when the round closes.</p>
          )}

          <p style={{ marginTop: "1rem" }}>
            <Link href={`/login?returnTo=/rounds/${summary.currentRound.id}`} className="btn">
              Log in to vote
            </Link>
          </p>
        </div>
      )}

      {!summary.currentRound && <p className="muted">No round open right now.</p>}

      <p className="muted">
        Watching for free — voting takes a verified account (one human, one vote).
      </p>
    </div>
  );
}
