"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { DiscoveryBrand, DiscoveryCreator } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { tierBadgeStyle, tierLabel } from "@/lib/tier";
import { Avatar } from "@/components/Avatar";
import { SegmentedControl } from "@/components/SegmentedControl";
import { ChevronRightIcon, PinIcon, RefreshIcon, SearchIcon, VerifiedIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import { CardSkeletonList } from "@/components/Skeleton";
import styles from "./discovery.module.css";

type Tab = "creators" | "brands";

export default function DiscoveryPage() {
  const [tab, setTab] = useState<Tab>("creators");
  const [creators, setCreators] = useState<DiscoveryCreator[] | null>(null);
  const [brands, setBrands] = useState<DiscoveryBrand[] | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [appliedFilter, setAppliedFilter] = useState("");
  const [error, setError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    setCreators(null);
    setBrands(null);
  }, [appliedFilter, requestKey]);

  useEffect(() => {
    const query = appliedFilter ? `?location=${encodeURIComponent(appliedFilter)}` : "";
    setError(false);
    if (tab === "creators" && creators === null) {
      api.get<DiscoveryCreator[]>(`/public/discovery/creators${query}`).then(setCreators).catch(() => { setCreators([]); setError(true); });
    }
    if (tab === "brands" && brands === null) {
      api.get<DiscoveryBrand[]>(`/public/discovery/brands${query}`).then(setBrands).catch(() => { setBrands([]); setError(true); });
    }
  }, [tab, creators, brands, appliedFilter, requestKey]);

  function applyFilter(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilter(locationFilter.trim());
  }

  const currentCount = tab === "creators" ? creators?.length : brands?.length;

  return (
    <div>
      <PageHeader eyebrow="People and brands" title="Discover momentum." description="Find creators building a track record and brands actively funding original work. Filter by city to see who is shaping the local scene." actions={<Link href="/map" className="btn secondary"><PinIcon width={17} height={17} aria-hidden />Open live map</Link>} />

      <div className={styles.controls}>
        <SegmentedControl name="discovery-tab" aria-label="Discover" value={tab} onChange={setTab} options={[{ value: "creators", label: "Top creators" }, { value: "brands", label: "Active brands" }]} />
        <form onSubmit={applyFilter} className={styles.searchForm}>
          <div className={styles.searchWrap}>
            <SearchIcon width={18} height={18} aria-hidden />
            <input value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} placeholder="Search a city or region" aria-label="Filter by location" />
          </div>
          <button type="submit" className="secondary">Apply</button>
          {appliedFilter && <button type="button" className="ghost" onClick={() => { setLocationFilter(""); setAppliedFilter(""); }}>Clear</button>}
        </form>
      </div>

      {error && <Notice tone="danger" title="Discovery couldn’t refresh" action={<button className="secondary" onClick={() => setRequestKey((key) => key + 1)}><RefreshIcon width={15} height={15} aria-hidden />Retry</button>}>The public discovery feed is temporarily unavailable.</Notice>}

      {currentCount !== undefined && currentCount !== null && currentCount > 0 && <p className={styles.resultMeta}>{currentCount} {tab === "creators" ? "creators" : "brands"}{appliedFilter ? ` near ${appliedFilter}` : " active now"}</p>}

      {tab === "creators" && creators === null && <CardSkeletonList count={4} />}
      {tab === "brands" && brands === null && <CardSkeletonList count={4} />}

      {tab === "creators" && creators?.length === 0 && !error && (
        <EmptyState icon={<PinIcon width={30} height={30} aria-hidden />} title={appliedFilter ? `No creators near “${appliedFilter}”` : "No creators yet"} body={appliedFilter ? "Try a nearby city or clear the filter to see everyone active now." : "Creators appear here as soon as they verify and start building a competition history."} action={appliedFilter ? undefined : { label: "View live map", href: "/map" }} />
      )}

      {tab === "brands" && brands?.length === 0 && !error && (
        <EmptyState icon={<PinIcon width={30} height={30} aria-hidden />} title={appliedFilter ? `No active brands near “${appliedFilter}”` : "No active campaigns"} body={appliedFilter ? "Clear the location to see every active brand." : "Brands appear here as soon as they secure a prize for a live challenge."} action={appliedFilter ? undefined : { label: "Browse challenges", href: "/challenges" }} />
      )}

      {tab === "creators" && creators && creators.length > 0 && (
        <div className={styles.grid}>
          {creators.map((creator, index) => (
            <article className={`card card-interactive card-enter ${styles.creatorCard}`} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }} key={creator.id}>
              <div className={styles.creatorTop}>
                <Link href={`/v/${creator.referralCode}`} className={styles.identity}>
                  <Avatar userId={creator.id} size={48} tier={creator.tier} />
                  <span className={styles.identityCopy}><strong>{creator.displayName ?? "Unnamed creator"}</strong><span>{creator.location ?? "Location not shared"}</span></span>
                </Link>
                <span className="badge badge-tier" style={tierBadgeStyle(creator.tier) as React.CSSProperties}>{tierLabel(creator.tier)}</span>
              </div>
              <div className={styles.creatorStats}>
                <div className={styles.stat}><strong>{creator.wins}</strong><span>Wins</span></div>
                <div className={styles.stat}><strong>{creator.tier + 1}</strong><span>Tier level</span></div>
              </div>
              <div className={styles.cardFooter}>
                <Link href={`/map?pin=${creator.id}`}><PinIcon width={15} height={15} aria-hidden />View on map</Link>
                <Link href={`/v/${creator.referralCode}`}>Live battle <ChevronRightIcon width={14} height={14} aria-hidden /></Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {tab === "brands" && brands && brands.length > 0 && (
        <div className={styles.grid}>
          {brands.map((brand, index) => (
            <article className={`card card-interactive card-enter ${styles.brandCard}`} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }} key={brand.id}>
              <div className={styles.brandTop}>
                <div className={styles.identity}>
                  <span className={styles.brandMark}>{(brand.displayName ?? "B").slice(0, 2).toUpperCase()}</span>
                  <span className={styles.identityCopy}><strong>{brand.displayName ?? "Unnamed brand"}</strong><span>{brand.location ?? "Remote"}{brand.isColdStart ? " · first campaign" : ""}</span></span>
                </div>
                {!brand.isColdStart && <VerifiedIcon width={20} height={20} style={{ color: "var(--accent)" }} aria-label="Active brand" />}
              </div>
              <div className={styles.brandMetrics}>
                <div className={styles.brandMetric}><strong>{brand.activeChallengeCount}</strong><span>Live challenges</span></div>
                <div className={styles.brandMetric}><strong>{formatCents(brand.activePrizePoolCents)}</strong><span>Secured prizes</span></div>
              </div>
              <div className={styles.cardFooter}><span className="muted">Funding original creator work</span><Link href="/challenges">View briefs <ChevronRightIcon width={14} height={14} aria-hidden /></Link></div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
