"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Challenge } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";

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

      {challenges === null && <p className="muted">Loading…</p>}
      {challenges?.length === 0 && <p className="muted">No challenges yet.</p>}

      {challenges?.map((c) => (
        <Link key={c.id} href={`/challenges/${c.id}`} style={{ textDecoration: "none" }}>
          <div className="card">
            <h2 style={{ margin: "0 0 0.25rem" }}>{c.title}</h2>
            <span className="badge">{c.status}</span>{" "}
            <span className="muted">{formatCents(c.prizePool)} pool</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
