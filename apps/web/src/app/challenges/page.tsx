"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { Challenge, ChallengeStatus } from "@/lib/types";
import { formatCents } from "@/lib/format";
import { useAuth } from "@/lib/auth-context";
import { ChevronRightIcon, LockIcon, PlayIcon, PlusIcon, RefreshIcon, SearchIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import { CardSkeletonList } from "@/components/Skeleton";
import { JourneyStage } from "@/components/JourneyProgress";
import { JourneyTaskbar } from "@/components/JourneyTaskbar";
import styles from "./challenges.module.css";

type Filter = "all" | "live" | "resolved";

const challengeArt = [
  "linear-gradient(135deg, #233420, #0d261e 45%, #2b280e)",
  "linear-gradient(135deg, #2a1715, #241326 48%, #10232b)",
  "linear-gradient(135deg, #15253a, #16261c 52%, #34270f)",
];

function isLive(status: ChallengeStatus) {
  return status === "funded" || status.includes("_open");
}

function statusLabel(status: ChallengeStatus) {
  if (status === "round1_open") return "Round 1 live";
  if (status === "round2_open") return "Round 2 live";
  if (status === "round3_open") return "Final live";
  if (status === "funded") return "Opening soon";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [journey, setJourney] = useState<JourneyStage[] | null>(null);
  const { user } = useAuth();

  const load = useCallback(() => {
    setError(false);
    setChallenges(null);
    api.get<Challenge[]>("/challenges").then(setChallenges).catch(() => {
      setChallenges([]);
      setError(true);
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) {
      setJourney(null);
      return;
    }
    api.get<Array<{ key: string; label: string; achieved: boolean }>>("/users/me/journey")
      .then((milestones) => {
        const liveId = challenges?.find((challenge) => isLive(challenge.status))?.id;
        const hrefFor = (key: string) => {
          if (key === "verified") return "/me";
          if (key === "first_entry" || key === "advanced") return liveId ? `/challenges/${liveId}` : "/challenges";
          if (key === "voted") return "/feed";
          if (key === "paid") return "/wallet";
          return "/me";
        };
        let nextIndex = milestones.findIndex((milestone) => !milestone.achieved);
        if (nextIndex < 0) nextIndex = Math.max(0, milestones.length - 1);
        setJourney(milestones.map((milestone, index) => ({
          id: milestone.key,
          label: milestone.label,
          description: milestone.achieved ? "This proof is now part of your creator record." : "Complete this milestone to keep your journey moving.",
          status: milestone.achieved ? "completed" : index === nextIndex ? "current" : "locked",
          actionLabel: milestone.achieved ? undefined : "Continue",
          href: milestone.achieved ? hrefFor(milestone.key) : hrefFor(milestone.key),
        })));
      })
      .catch(() => setJourney(null));
  }, [challenges, user]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (challenges ?? []).filter((challenge) => {
      const matchesQuery = !normalized || `${challenge.title} ${challenge.brief}`.toLowerCase().includes(normalized);
      const matchesFilter = filter === "all" || (filter === "live" ? isLive(challenge.status) : challenge.status === "resolved");
      return matchesQuery && matchesFilter;
    });
  }, [challenges, filter, query]);

  const canCreate = user?.role === "seller" || user?.role === "both";

  return (
    <div>
      <PageHeader
        eyebrow="Funded creative briefs"
        title="Your next win starts here."
        description="Browse live competitions, study the brief and enter with your strongest idea. Blind voting keeps follower counts out of the result."
        actions={canCreate ? <Link href="/challenges/new" className="btn"><PlusIcon width={18} height={18} aria-hidden />New challenge</Link> : <Link href="/feed" className="btn secondary"><PlayIcon width={17} height={17} aria-hidden />Watch live</Link>}
      />

      {user && journey && (
        <JourneyTaskbar
          journey={journey}
          activeContext={challenges?.find((challenge) => isLive(challenge.status)) ? {
            id: challenges.find((challenge) => isLive(challenge.status))!.id,
            kind: "challenge",
            title: challenges.find((challenge) => isLive(challenge.status))!.title,
            status: "active",
          } : undefined}
          nextAction={challenges?.find((challenge) => isLive(challenge.status)) ? {
            label: "Open the brief",
            href: `/challenges/${challenges.find((challenge) => isLive(challenge.status))!.id}`,
            tone: "primary",
          } : { label: "Discover a brief", href: "/challenges", tone: "secondary" }}
        />
      )}

      <div className={styles.toolbar}>
        <div className={styles.search}>
          <SearchIcon width={18} height={18} aria-hidden />
          <label className="sr-only" htmlFor="challenge-search">Search challenges</label>
          <input id="challenge-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search briefs or themes" />
        </div>
        <div className={styles.filters} aria-label="Challenge filters">
          {(["all", "live", "resolved"] as Filter[]).map((value) => (
            <button key={value} className={`${styles.filter} ${filter === value ? styles.filterActive : ""}`} onClick={() => setFilter(value)} aria-pressed={filter === value}>
              {value === "all" ? "For you" : value === "live" ? "Live now" : "Past winners"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Notice tone="danger" title="Challenges are taking a break" action={<button className="secondary" onClick={load}><RefreshIcon width={16} height={16} aria-hidden />Retry</button>}>
          We couldn’t reach the challenge feed. Your account and entries are unaffected.
        </Notice>
      )}

      {challenges === null && <CardSkeletonList count={4} media />}

      {challenges !== null && !error && challenges.length === 0 && (
        <EmptyState icon={<PlayIcon width={30} height={30} aria-hidden />} title="No live challenges right now" body="New briefs appear here as soon as a brand secures the prize. Explore creators while the next one gets ready." action={{ label: "Discover creators", href: "/discovery" }} />
      )}

      {challenges !== null && challenges.length > 0 && visible.length === 0 && (
        <EmptyState icon={<SearchIcon width={30} height={30} aria-hidden />} title="No challenge matches that search" body="Try a broader word or switch back to all challenges." />
      )}

      {visible.length > 0 && <div className={styles.summary}><span>{visible.length} {visible.length === 1 ? "brief" : "briefs"}</span><span>Prize secured before entries open</span></div>}

      <div className={styles.grid}>
        {visible.map((challenge, index) => (
          <Link key={challenge.id} href={`/challenges/${challenge.id}`} className={styles.link}>
            <article className={`card card-interactive card-enter ${styles.card}`} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
              <div className={styles.media} style={{ ["--challenge-art" as string]: challengeArt[index % challengeArt.length] }}>
                <span className={`${isLive(challenge.status) ? "badge badge-live" : "badge"} ${styles.status}`}>{statusLabel(challenge.status)}</span>
                <span className={styles.mediaIcon}><PlayIcon width={22} height={22} aria-hidden /></span>
                <p className={styles.mediaLabel}>Creative competition · blind voting</p>
              </div>
              <div className={styles.body}>
                <h2>{challenge.title}</h2>
                <p>{challenge.brief || "Open the brief to see the creative direction and entry requirements."}</p>
                <div className={styles.prizeRow}>
                  <div><span className={styles.prizeLabel}>Winner prize</span><span className={`${styles.prize} money`}>{formatCents(challenge.prizePool)}</span></div>
                  <span className={styles.openLabel}><LockIcon width={14} height={14} aria-hidden />Secured <ChevronRightIcon width={15} height={15} aria-hidden /></span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
