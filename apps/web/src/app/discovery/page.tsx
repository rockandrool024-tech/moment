"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { DiscoveryBrand, DiscoveryCreator } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { tierLabel } from "@/lib/tier";
import { avatarUrl } from "@/lib/avatar";

type Tab = "creators" | "brands";

// No-auth discovery feed (Sprint 2) — same public/cached surface as the
// battle and results pages, so it's browsable by a spectator who has never
// logged in, not just an existing user.
export default function DiscoveryPage() {
  const [tab, setTab] = useState<Tab>("creators");
  const [creators, setCreators] = useState<DiscoveryCreator[] | null>(null);
  const [brands, setBrands] = useState<DiscoveryBrand[] | null>(null);

  useEffect(() => {
    if (tab === "creators" && creators === null) {
      api.get<DiscoveryCreator[]>("/public/discovery/creators").then(setCreators);
    }
    if (tab === "brands" && brands === null) {
      api.get<DiscoveryBrand[]>("/public/discovery/brands").then(setBrands);
    }
  }, [tab, creators, brands]);

  return (
    <div>
      <h1>Discover</h1>
      <div className="nav" style={{ border: "none", padding: 0, marginBottom: "1rem" }}>
        <button className={tab === "creators" ? "" : "secondary"} onClick={() => setTab("creators")}>
          Top creators
        </button>
        <button className={tab === "brands" ? "" : "secondary"} onClick={() => setTab("brands")}>
          Active brands
        </button>
      </div>

      {tab === "creators" && (
        <>
          {creators === null && <p className="muted">Loading…</p>}
          {creators?.length === 0 && <p className="muted">No creators yet.</p>}
          {creators?.map((c) => (
            <Link key={c.id} href={`/v/${c.referralCode}`} style={{ textDecoration: "none" }}>
              <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- external, API-served avatar */}
                  <img
                    src={avatarUrl(c.id)}
                    alt=""
                    width={36}
                    height={36}
                    style={{ borderRadius: "50%", border: "1px solid var(--border)" }}
                  />
                  {c.displayName ?? "Unnamed creator"}
                </span>
                <span>
                  <span className="badge">{tierLabel(c.tier)}</span>{" "}
                  <span className="muted">{c.wins} wins</span>
                </span>
              </div>
            </Link>
          ))}
        </>
      )}

      {tab === "brands" && (
        <>
          {brands === null && <p className="muted">Loading…</p>}
          {brands?.length === 0 && <p className="muted">No active campaigns right now.</p>}
          {brands?.map((b) => (
            <div key={b.id} className="card" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>
                {b.displayName ?? "Unnamed brand"}
                {b.isColdStart && <span className="muted"> · first campaign</span>}
              </span>
              <span className="muted">
                {b.activeChallengeCount} live · {formatCents(b.activePrizePoolCents)} escrowed
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
