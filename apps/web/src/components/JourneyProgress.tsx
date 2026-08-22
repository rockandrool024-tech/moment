"use client";

import Link from "next/link";
import {
  CheckIcon,
  ChevronRightIcon,
  FilmIcon,
  LockIcon,
  RallyIcon,
  VoteCheckIcon,
  WalletIcon,
} from "@/components/icons";
import styles from "./JourneyProgress.module.css";

export type JourneyStageStatus = "completed" | "current" | "available" | "locked" | "review" | "retry";

export interface JourneyStage {
  id: string;
  label: string;
  description: string;
  status: JourneyStageStatus;
  reward?: string;
  actionLabel?: string;
  href?: string;
  timestamp?: string;
}

interface JourneyProgressProps {
  stages: JourneyStage[];
  title?: string;
  eyebrow?: string;
  summary?: string;
  compact?: boolean;
  className?: string;
}

function StageIcon({ stage }: { stage: JourneyStage }) {
  if (stage.status === "completed") return <CheckIcon width={17} height={17} aria-hidden />;
  if (stage.status === "locked") return <LockIcon width={16} height={16} aria-hidden />;
  if (stage.id.includes("teaser") || stage.id.includes("video")) return <FilmIcon width={17} height={17} aria-hidden />;
  if (stage.id.includes("vote") || stage.id.includes("review")) return <VoteCheckIcon width={17} height={17} aria-hidden />;
  if (stage.id.includes("rally")) return <RallyIcon width={17} height={17} aria-hidden />;
  if (stage.id.includes("reward") || stage.id.includes("wallet")) return <WalletIcon width={17} height={17} aria-hidden />;
  return <ChevronRightIcon width={17} height={17} aria-hidden />;
}

function statusLabel(status: JourneyStageStatus) {
  if (status === "completed") return "Complete";
  if (status === "current") return "Your next step";
  if (status === "review") return "In review";
  if (status === "retry") return "Action needed";
  if (status === "available") return "Ready";
  return "Locked";
}

export function JourneyProgress({
  stages,
  title = "Your journey",
  eyebrow = "Creator progress",
  summary,
  compact = false,
  className,
}: JourneyProgressProps) {
  const currentIndex = Math.max(0, stages.findIndex((stage) => stage.status === "current" || stage.status === "retry" || stage.status === "review"));
  const completedCount = stages.filter((stage) => stage.status === "completed").length;
  const progress = stages.length ? Math.round((completedCount / stages.length) * 100) : 0;

  return (
    <section className={`${styles.root} ${compact ? styles.compact : ""} ${className ?? ""}`} aria-label={title}>
      <div className={styles.header}>
        <div>
          <span className="page-eyebrow">{eyebrow}</span>
          <h2 className={styles.title}>{title}</h2>
          {summary && <p className={styles.summary}>{summary}</p>}
        </div>
        <div className={styles.progressBadge} aria-label={`${progress}% complete`}>
          <strong>{progress}%</strong><span>complete</span>
        </div>
      </div>

      <div className={styles.progressTrack} aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>

      <ol className={styles.rail}>
        {stages.map((stage, index) => {
          const isCurrent = index === currentIndex && stage.status !== "completed";
          const content = (
            <>
              <span className={`${styles.node} ${styles[stage.status]} ${isCurrent ? styles.focus : ""}`}>
                <StageIcon stage={stage} />
              </span>
              <span className={styles.connector} aria-hidden="true" />
              <span className={styles.copy}>
                <span className={styles.stageTopline}>
                  <span className={styles.stageLabel}>{stage.label}</span>
                  <span className={`${styles.status} ${styles[stage.status]}`}>{statusLabel(stage.status)}</span>
                </span>
                <span className={styles.description}>{stage.description}</span>
                {stage.reward && <span className={styles.reward}>{stage.reward}</span>}
                {stage.timestamp && <span className={styles.timestamp}>{stage.timestamp}</span>}
                {stage.actionLabel && stage.status !== "locked" && stage.status !== "completed" && (
                  <span className={styles.action}>{stage.actionLabel}<ChevronRightIcon width={14} height={14} aria-hidden /></span>
                )}
              </span>
            </>
          );

          return (
            <li key={stage.id} className={`${styles.item} ${stage.status === "locked" ? styles.isLocked : ""}`} aria-current={isCurrent ? "step" : undefined}>
              {stage.href && stage.status !== "locked" ? <Link href={stage.href} className={styles.stageLink}>{content}</Link> : <div className={styles.stageLink}>{content}</div>}
            </li>
          );
        })}
      </ol>

      <p className={styles.note}>
        Quality progress and rally momentum stay separate. Your supporters can amplify the story, but they cannot buy the quality result.
      </p>
    </section>
  );
}
