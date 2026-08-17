"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { MyStorySummary, Story, StoryStage } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { StatCard } from "@/components/StatCard";
import { CountUp } from "@/components/CountUp";

const STAGES: { key: StoryStage; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "claimed", label: "Claimed" },
  { key: "content_added", label: "Content made" },
  { key: "posted", label: "Posted" },
];

// Derived, not stored (see StoriesService.myStories / ADR-006) — the
// storyteller's own lifecycle readout for one Story.
function LifecycleStepper({ stage }: { stage: StoryStage }) {
  const currentIdx = STAGES.findIndex((s) => s.key === stage);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", margin: "0.6rem 0" }}>
      {STAGES.map((s, i) => (
        <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "0.3rem", flex: i < STAGES.length - 1 ? 1 : undefined }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
            <span
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: i <= currentIdx ? "var(--accent)" : "var(--border)",
                boxShadow: i === currentIdx ? "0 0 8px var(--accent)" : "none",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: "0.62rem",
                color: i <= currentIdx ? "var(--fg)" : "var(--text-muted)",
                fontWeight: i === currentIdx ? 700 : 500,
                whiteSpace: "nowrap",
              }}
            >
              {s.label}
            </span>
          </div>
          {i < STAGES.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < currentIdx ? "var(--accent)" : "var(--border)", marginBottom: "1.1rem" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function MyStoriesDashboard() {
  const [mine, setMine] = useState<MyStorySummary[] | null>(null);

  useEffect(() => {
    api.get<MyStorySummary[]>("/stories/me/mine").then(setMine);
  }, []);

  if (mine === null || mine.length === 0) return null;

  return (
    <div className="card-elevated" style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ margin: "0 0 0.2rem", fontSize: "1.05rem" }}>My stories</h2>
      <p className="muted" style={{ fontSize: "0.82rem", margin: "0 0 1rem" }}>
        Engagement numbers are what creators reported themselves — never verified, never scored.
      </p>
      {mine.map((s) => (
        <div key={s.id} style={{ borderTop: "1px solid var(--border)", paddingTop: "0.9rem", marginTop: "0.9rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem", flexWrap: "wrap" }}>
            <Link href={`/stories/${s.id}`} style={{ fontWeight: 700, textDecoration: "none", color: "inherit" }}>
              {s.title}
            </Link>
            <span className="badge">{s.access}</span>
          </div>
          <LifecycleStepper stage={s.stage} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem" }}>
            <StatCard label="Claimed by" value={<CountUp value={s.claimCount} />} />
            <StatCard label="Content pieces" value={<CountUp value={s.contentCount} />} />
            <StatCard
              label="Reported views"
              value={<CountUp value={s.reportedViews} format={(n) => Math.round(n).toLocaleString()} />}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    api.get<Story[]>("/stories").then(setStories);
  }, []);

  return (
    <div>
      <div className="nav" style={{ border: "none", padding: 0, marginBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>Stories</h1>
        <span className="spacer" />
        {(user?.role === "seller" || user?.role === "both") && (
          <Link href="/stories/new" className="btn">
            New story
          </Link>
        )}
      </div>
      <p className="muted">
        A story is a brief a brand offers, free or paid, that a creator can claim and turn into
        content. A funded, competitive brief runs as a <Link href="/challenges">Challenge</Link>{" "}
        instead.
      </p>

      {(user?.role === "seller" || user?.role === "both") && <MyStoriesDashboard />}

      {stories === null && <p className="muted">Loading…</p>}
      {stories?.length === 0 && <p className="muted">No stories yet.</p>}

      {stories?.map((s) => (
        <Link key={s.id} href={`/stories/${s.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card">
            <h2 style={{ margin: "0 0 0.25rem" }}>{s.title}</h2>
            <span className="badge">{s.access}</span> <span className="badge">{s.mode}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
