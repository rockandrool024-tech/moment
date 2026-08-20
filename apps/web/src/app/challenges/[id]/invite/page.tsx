"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api-client";
import { Challenge, DiscoveryCreator } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { tierBadgeStyle, tierLabel } from "@/lib/tier";
import { Avatar } from "@/components/Avatar";
import { ArrowLeftIcon, CheckIcon, SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import { CardSkeletonList } from "@/components/Skeleton";
import styles from "./invite.module.css";

export default function InviteCreatorsPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [creators, setCreators] = useState<DiscoveryCreator[]>([]);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaign, list] = await Promise.all([api.get<Challenge>(`/challenges/${id}`), api.get<DiscoveryCreator[]>("/public/discovery/creators")]);
      setChallenge(campaign);
      setCreators(list);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Creators couldn’t be loaded.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function invite(creatorId: string) {
    setError(null);
    setBusyId(creatorId);
    try {
      await api.post(`/challenges/${id}/invite`, { creatorId });
      setInvitedIds((previous) => new Set(previous).add(creatorId));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The invite couldn’t be sent.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    return creators.filter((creator) => !value || `${creator.displayName ?? ""} ${creator.location ?? ""}`.toLowerCase().includes(value));
  }, [creators, query]);

  if (authLoading || loading) return <CardSkeletonList count={4} />;
  if (!challenge) return <Notice tone="danger" title="Campaign unavailable" action={<button className="secondary" onClick={() => void load()}>Retry</button>}>{error ?? "This campaign could not be found."}</Notice>;
  if (!user || user.id !== challenge.sellerId) return <Notice tone="danger" title="Owner access only">Only the brand account that created this campaign can invite creators.</Notice>;

  return (
    <div>
      <Link href={`/challenges/${id}`} className={styles.back}><ArrowLeftIcon width={16} height={16} aria-hidden />Back to campaign</Link>
      <PageHeader eyebrow="Creator outreach" title="Invite people who fit the brief." description="Invited creators receive a direct notification to review the campaign. An invite is a signal of fit, never a guarantee of advancement." />
      {error && <Notice tone="danger" title="Invite needs attention">{error}</Notice>}
      <div className={styles.summary}><div><strong>{challenge.title}</strong><span>{creators.length} discoverable creators · {invitedIds.size} invited this session</span></div><span className="badge">{challenge.status.replaceAll("_", " ")}</span></div>
      <div className={styles.search}><SearchIcon width={18} height={18} aria-hidden /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by creator name or city" aria-label="Search creators" /></div>
      {filtered.length === 0 ? <EmptyState icon={<SearchIcon width={28} height={28} aria-hidden />} title="No creators match that search" body="Try another name or clear the location term." /> : (
        <div className={styles.grid}>
          {filtered.map((creator) => {
            const invited = invitedIds.has(creator.id);
            return (
              <article className={`card ${styles.card}`} key={creator.id}>
                <Avatar userId={creator.id} size={48} tier={creator.tier} />
                <div className={styles.copy}><strong>{creator.displayName ?? "Unnamed creator"}</strong><span>{creator.location ?? "Location not shared"}</span><div className={styles.meta}><span className="badge badge-tier" style={tierBadgeStyle(creator.tier) as React.CSSProperties}>{tierLabel(creator.tier)}</span><span>{creator.wins} win{creator.wins === 1 ? "" : "s"}</span></div></div>
                <button className={invited ? styles.invited : "secondary"} onClick={() => void invite(creator.id)} disabled={invited || busyId === creator.id}>{invited ? <><CheckIcon width={15} height={15} aria-hidden />Invited</> : busyId === creator.id ? "Sending…" : "Invite"}</button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
