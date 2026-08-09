"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Story } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

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
