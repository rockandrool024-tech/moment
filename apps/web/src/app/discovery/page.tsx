"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { DiscoveryBrand, DiscoveryCreator } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { tierBadgeStyle, tierLabel } from "@/lib/tier";
import { Avatar } from "@/components/Avatar";
import { SegmentedControl } from "@/components/SegmentedControl";
import { PinIcon } from "@/components/icons";

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
      <div style={{ marginBottom: "1rem" }}>
        <SegmentedControl
          name="discovery-tab"
          aria-label="Discover"
          value={tab}
          onChange={setTab}
          options={[
            { value: "creators", label: "Top creators" },
            { value: "brands", label: "Active brands" },
          ]}
        />
      </div>

      {tab === "creators" && (
        <>
          {creators === null && <p className="muted">Loading…</p>}
          {creators?.length === 0 && <p className="muted">No creators yet.</p>}
          {creators?.map((c) => (
            <div
              key={c.id}
              className="card card-elevated card-interactive"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <Link
                href={`/v/${c.referralCode}`}
                style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "0.7rem" }}
              >
                <Avatar userId={c.id} size={36} tier={c.tier} />
                {c.displayName ?? "Unnamed creator"}
              </Link>
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span className="badge badge-tier" style={tierBadgeStyle(c.tier) as React.CSSProperties}>
                  {tierLabel(c.tier)}
                </span>
                <span className="muted">{c.wins} wins</span>
                <Link href={`/map?pin=${c.id}`} className="muted" title="View on map">
                  <PinIcon width={16} height={16} aria-hidden />
                </Link>
              </span>
            </div>
          ))}
        </>
      )}

      {tab === "brands" && (
        <>
          {brands === null && <p className="muted">Loading…</p>}
          {brands?.length === 0 && <p className="muted">No active campaigns right now.</p>}
          {brands?.map((b) => (
            <div
              key={b.id}
              className="card card-elevated card-interactive"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <PinIcon width={18} height={18} style={{ color: "var(--rally)" }} aria-hidden />
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
