"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

// A logged-in visitor is sent straight to their app; a cold visitor sees an
// actual landing page instead of an empty "Loading…" flash — the first
// thing anyone lands on, currently worth explaining what Perokio even is
// before asking for a phone number (UX audit P1-2).
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/challenges");
  }, [loading, user, router]);

  if (loading || user) return <p className="muted">Loading…</p>;

  return (
    <div style={{ textAlign: "center", padding: "2.5rem 0" }}>
      <p style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--accent)", margin: "0 0 0.5rem" }}>
        PEROKIO
      </p>
      <p style={{ fontSize: "1.15rem", margin: "0 0 0.25rem" }}>
        Creators compete for real cash prizes. You vote on who wins.
      </p>
      <p className="muted" style={{ maxWidth: 440, margin: "0 auto 1.75rem" }}>
        Brands fund the pool, creators submit content, blind peer voting narrows the field, and
        the public picks the winner — escrowed with Stripe, paid out when the round closes.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/login" className="btn">
          Get started
        </Link>
        <Link
          href="/discovery"
          className="btn"
          style={{ background: "transparent", color: "var(--accent)" }}
        >
          See what&rsquo;s live
        </Link>
      </div>
    </div>
  );
}
