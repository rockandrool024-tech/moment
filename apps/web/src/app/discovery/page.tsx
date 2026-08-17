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
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";

type Tab = "creators" | "brands";

// No-auth discovery feed (Sprint 2) — same public/cached surface as the
// battle and results pages, so it's browsable by a spectator who has never
// logged in, not just an existing user.
export default function DiscoveryPage() {
  const [tab, setTab] = useState<Tab>("creators");
  const [creators, setCreators] = useState<DiscoveryCreator[] | null>(null);
  const [brands, setBrands] = useState<DiscoveryBrand[] | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");

  useEffect(() => {
    setCreators(null);
    setBrands(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on filter change only
  }, [appliedFilter]);

  useEffect(() => {
    const query = appliedFilter ? `?location=${encodeURIComponent(appliedFilter)}` : "";
    if (tab === "creators" && creators === null) {
      api.get<DiscoveryCreator[]>(`/public/discovery/creators${query}`).then(setCreators);
    }
    if (tab === "brands" && brands === null) {
      api.get<DiscoveryBrand[]>(`/public/discovery/brands${query}`).then(setBrands);
    }
  }, [tab, creators, brands, appliedFilter]);

  function applyFilter(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilter(locationFilter.trim());
  }

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

      <form onSubmit={applyFilter} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          placeholder="Filter by location…"
          aria-label="Filter by location"
          style={{ flex: 1 }}
        />
        <button type="submit" className="secondary">
          Filter
        </button>
        {appliedFilter && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setLocationFilter("");
              setAppliedFilter("");
            }}
          >
            Clear
          </button>
        )}
      </form>

      {tab === "creators" && (
        <>
          {creators === null && <Loading label="Loading creators" />}
          {creators?.length === 0 && (
            <EmptyState
              icon={<PinIcon width={30} height={30} aria-hidden />}
              title={appliedFilter ? `No creators near "${appliedFilter}"` : "No creators yet"}
              body={
                appliedFilter
                  ? "Try clearing the filter to see everyone active right now."
                  : "Creators show up here as soon as they verify and join."
              }
              action={appliedFilter ? undefined : { label: "View live map", href: "/map" }}
            />
          )}
          {creators?.map((c, i) => (
            <div
              key={c.id}
              className="card card-elevated card-interactive card-enter"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <Link
                href={`/v/${c.referralCode}`}
                style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "0.7rem" }}
              >
                <Avatar userId={c.id} size={36} tier={c.tier} />
                <span>
                  {c.displayName ?? "Unnamed creator"}
                  {c.location && <span className="muted"> · {c.location}</span>}
                </span>
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
          {brands === null && <Loading label="Loading brands" />}
          {brands?.length === 0 && (
            <EmptyState
              icon={<PinIcon width={30} height={30} aria-hidden />}
              title={appliedFilter ? `No active brands near "${appliedFilter}"` : "No active campaigns"}
              body={
                appliedFilter
                  ? "Try clearing the filter to see everyone active right now."
                  : "Brands show up here the moment they fund a live challenge."
              }
              action={appliedFilter ? undefined : { label: "Browse challenges", href: "/challenges" }}
            />
          )}
          {brands?.map((b, i) => (
            <div
              key={b.id}
              className="card card-elevated card-interactive card-enter"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", animationDelay: `${Math.min(i, 8) * 40}ms` }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <PinIcon width={18} height={18} style={{ color: "var(--rally)" }} aria-hidden />
                {b.displayName ?? "Unnamed brand"}
                {b.location && <span className="muted"> · {b.location}</span>}
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
