"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Challenge, ChallengeStatus } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { PlayIcon } from "@/components/icons";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";

// Matches /map's legend: coral for anything live, accent green once
// resolved, a flat border for draft/cancelled — same color language as the
// "live challenge" pin, not a new palette per screen.
function statusEdgeColor(status: ChallengeStatus): string {
  if (status === "resolved") return "var(--accent)";
  if (status === "cancelled" || status === "draft") return "var(--border)";
  return "var(--rally)"; // funded, round1/2/3_open
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get<Challenge[]>("/challenges").then(setChallenges);
  }, []);

  return (
    <div>
      <div className="nav" style={{ border: "none", padding: 0, marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Challenges</h1>
        <span className="spacer" />
        {(user?.role === "seller" || user?.role === "both") && (
          <Link href="/challenges/new" className="btn">
            New challenge
          </Link>
        )}
      </div>

      {challenges === null && <Loading label="Loading challenges" />}
      {challenges?.length === 0 && (
        <EmptyState
          icon={<PlayIcon width={30} height={30} aria-hidden />}
          title="No live challenges right now"
          body="New ones show up here the moment a brand funds them — check back soon."
        />
      )}

      {challenges?.map((c, i) => (
        <Link key={c.id} href={`/challenges/${c.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div
            className="card card-elevated card-edged card-interactive card-enter"
            style={{
              ["--edge-color" as string]: statusEdgeColor(c.status),
              display: "flex",
              alignItems: "center",
              gap: "0.9rem",
              animationDelay: `${Math.min(i, 8) * 40}ms`,
            }}
          >
            <span
              style={{
                width: 48,
                height: 48,
                flexShrink: 0,
                borderRadius: 10,
                background: "var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--muted)",
              }}
            >
              <PlayIcon width={20} height={20} aria-hidden />
            </span>
            <div>
              <h2 style={{ margin: "0 0 0.25rem" }}>{c.title}</h2>
              <span className="badge">{c.status}</span>{" "}
              <span className="muted">{formatCents(c.prizePool)} pool</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
