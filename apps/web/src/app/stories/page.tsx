"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { MyStorySummary, Story, StoryAccess, StoryStage } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { CountUp } from "@/components/CountUp";
import { ChevronRightIcon, FilmIcon, PlusIcon, RefreshIcon } from "@/components/icons";
import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import { CardSkeletonList } from "@/components/Skeleton";
import styles from "./stories.module.css";

const STAGES: { key: StoryStage; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "claimed", label: "Claimed" },
  { key: "content_added", label: "Content" },
  { key: "posted", label: "Posted" },
];

const storyArt = [
  "linear-gradient(135deg,#2a2510,#15241e 52%,#112132)",
  "linear-gradient(135deg,#2c171a,#1f1732 50%,#102421)",
  "linear-gradient(135deg,#142b2d,#192017 52%,#352910)",
];

function LifecycleStepper({ stage }: { stage: StoryStage }) {
  const currentIndex = STAGES.findIndex((item) => item.key === stage);
  return (
    <div className={styles.stepper} aria-label={`Story stage: ${STAGES[currentIndex]?.label ?? stage}`}>
      {STAGES.map((item, index) => (
        <div className={styles.step} key={item.key}>
          <div className={styles.nodeWrap}><span className={`${styles.node} ${index < currentIndex ? styles.nodeDone : ""} ${index === currentIndex ? styles.nodeCurrent : ""}`} /><span className={`${styles.stepLabel} ${index <= currentIndex ? styles.stepLabelActive : ""}`}>{item.label}</span></div>
          {index < STAGES.length - 1 && <span className={`${styles.line} ${index < currentIndex ? styles.lineDone : ""}`} />}
        </div>
      ))}
    </div>
  );
}

function MyStoriesDashboard() {
  const [mine, setMine] = useState<MyStorySummary[] | null>(null);
  useEffect(() => { api.get<MyStorySummary[]>("/stories/me/mine").then(setMine).catch(() => setMine([])); }, []);
  if (mine === null || mine.length === 0) return null;

  return (
    <section className={`card card-elevated ${styles.dashboard}`}>
      <span className="page-eyebrow">Brand workspace</span>
      <h2>Story lifecycle</h2>
      <p className="muted">Views and likes are creator-reported context. They are never verified, ranked or used in payouts.</p>
      {mine.map((story) => (
        <div className={styles.storyProgress} key={story.id}>
          <div className={styles.progressHead}><Link href={`/stories/${story.id}`}>{story.title}</Link><span className="badge">{story.access}</span></div>
          <LifecycleStepper stage={story.stage} />
          <div className={styles.dashboardStats}>
            <div className={styles.miniStat}><strong><CountUp value={story.claimCount} /></strong><span>Claims</span></div>
            <div className={styles.miniStat}><strong><CountUp value={story.contentCount} /></strong><span>Content pieces</span></div>
            <div className={styles.miniStat}><strong><CountUp value={story.reportedViews} format={(value) => Math.round(value).toLocaleString()} /></strong><span>Reported views</span></div>
          </div>
        </div>
      ))}
    </section>
  );
}

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[] | null>(null);
  const [filter, setFilter] = useState<"ALL" | StoryAccess>("ALL");
  const [error, setError] = useState(false);
  const [requestKey, setRequestKey] = useState(0);
  const { user } = useAuth();
  const canCreate = user?.role === "seller" || user?.role === "both";

  useEffect(() => {
    setStories(null);
    setError(false);
    api.get<Story[]>("/stories").then(setStories).catch(() => { setStories([]); setError(true); });
  }, [requestKey]);

  const visible = useMemo(() => (stories ?? []).filter((story) => filter === "ALL" || story.access === filter), [stories, filter]);

  return (
    <div>
      <PageHeader eyebrow="Open creative briefs" title="Tell stories, not just ads." description="Stories are non-competitive briefs a creator can claim and turn into content. A funded tournament with blind voting belongs in Challenges." actions={canCreate ? <Link href="/stories/new" className="btn"><PlusIcon width={17} height={17} aria-hidden />New story</Link> : <Link href="/challenges" className="btn secondary">Browse challenges</Link>} />
      {canCreate && <MyStoriesDashboard />}
      <div className={styles.controls} aria-label="Story access filters">{(["ALL", "FREE", "PAID"] as const).map((value) => <button key={value} className={`${styles.filter} ${filter === value ? styles.active : ""}`} onClick={() => setFilter(value)} aria-pressed={filter === value}>{value === "ALL" ? "All stories" : value === "FREE" ? "Open briefs" : "Paid briefs"}</button>)}</div>
      {error && <Notice tone="danger" title="Stories couldn’t refresh" action={<button className="secondary" onClick={() => setRequestKey((key) => key + 1)}><RefreshIcon width={15} height={15} aria-hidden />Retry</button>}>The story feed is temporarily unavailable.</Notice>}
      {stories === null && <CardSkeletonList count={4} media />}
      {stories && visible.length === 0 && !error && <EmptyState icon={<FilmIcon width={30} height={30} aria-hidden />} title={filter === "ALL" ? "No stories yet" : `No ${filter.toLowerCase()} stories right now`} body="New story briefs appear here as brands publish them." action={canCreate ? { label: "Create the first story", href: "/stories/new" } : { label: "Browse challenges", href: "/challenges" }} />}
      <div className={styles.grid}>
        {visible.map((story, index) => (
          <Link className={styles.link} href={`/stories/${story.id}`} key={story.id}>
            <article className={`card card-interactive card-enter ${styles.card}`} style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}>
              <div className={styles.art} style={{ ["--story-art" as string]: storyArt[index % storyArt.length] }}><div className={styles.artBadges}><span className="badge badge-accent">{story.access}</span><span className="badge">{story.mode}</span></div><span className={styles.artLabel}>Creator story brief</span></div>
              <div className={styles.body}><h2>{story.title}</h2><p>{story.brief}</p><div className={styles.foot}><span>{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(story.createdAt))}</span><span>View brief <ChevronRightIcon width={14} height={14} aria-hidden /></span></div></div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
