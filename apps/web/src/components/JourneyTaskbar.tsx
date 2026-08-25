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
import { JourneyStage, JourneyStageStatus } from "@/components/JourneyProgress";
import styles from "./JourneyTaskbar.module.css";

export interface JourneyTaskbarContext {
  id: string;
  kind: "challenge" | "story";
  title: string;
  deadline?: string;
  status?: "active" | "waiting" | "completed" | "blocked";
}

export interface JourneyTaskbarAction {
  label: string;
  href?: string;
  tone?: "primary" | "secondary";
}

interface JourneyTaskbarProps {
  journey: JourneyStage[];
  activeContext?: JourneyTaskbarContext;
  mode?: "home" | "challenge" | "focus" | "completion";
  nextAction?: JourneyTaskbarAction;
  eyebrow?: string;
  onDismiss?: () => void;
  className?: string;
}

function stageIcon(stage: JourneyStage) {
  if (stage.status === "completed") return <CheckIcon width={15} height={15} aria-hidden />;
  if (stage.status === "locked") return <LockIcon width={14} height={14} aria-hidden />;
  if (stage.id.includes("teaser") || stage.id.includes("video")) return <FilmIcon width={15} height={15} aria-hidden />;
  if (stage.id.includes("vote") || stage.id.includes("review")) return <VoteCheckIcon width={15} height={15} aria-hidden />;
  if (stage.id.includes("rally")) return <RallyIcon width={15} height={15} aria-hidden />;
  if (stage.id.includes("reward") || stage.id.includes("wallet")) return <WalletIcon width={15} height={15} aria-hidden />;
  return <ChevronRightIcon width={15} height={15} aria-hidden />;
}

function statusText(status: JourneyStageStatus) {
  if (status === "completed") return "Done";
  if (status === "review") return "In review";
  if (status === "retry") return "Action needed";
  if (status === "available") return "Ready";
  if (status === "locked") return "Later";
  return "Next";
}

function contextStatus(context?: JourneyTaskbarContext) {
  if (!context) return "Start your story";
  if (context.status === "waiting") return "Your work is safe while the round moves";
  if (context.status === "blocked") return "One action needs your attention";
  if (context.status === "completed") return "Your story reached the reveal";
  return "Your next move is ready";
}

export function JourneyTaskbar({
  journey,
  activeContext,
  mode = "home",
  nextAction,
  eyebrow = "Creator journey",
  onDismiss,
  className,
}: JourneyTaskbarProps) {
  const activeIndex = Math.max(0, journey.findIndex((stage) => ["current", "retry", "review", "available"].includes(stage.status)));
  const activeStage = journey[activeIndex];
  const completed = journey.filter((stage) => stage.status === "completed").length;
  const progress = journey.length ? Math.round((completed / journey.length) * 100) : 0;
  const isWaiting = activeContext?.status === "waiting" || activeStage?.status === "review";
  const isComplete = mode === "completion" || activeContext?.status === "completed";
  const action = nextAction ?? (activeStage?.actionLabel && activeStage.href ? { label: activeStage.actionLabel, href: activeStage.href, tone: "primary" as const } : undefined);

  return (
    <section className={`${styles.root} ${styles[mode]} ${className ?? ""}`} aria-labelledby="journey-taskbar-title">
      <div className={styles.topline}>
        <div className={styles.context}>
          <span className="page-eyebrow">{eyebrow}</span>
          <div className={styles.titleRow}>
            <h2 id="journey-taskbar-title">{activeContext?.title ?? "Your next story"}</h2>
            <span className={styles.percent} aria-label={`${progress}% of journey complete`}>{progress}%</span>
          </div>
          <p className={styles.state}>{isComplete ? "Your result is verified. Your next opportunity is ready." : contextStatus(activeContext)}</p>
        </div>
        {onDismiss && <button className={styles.dismiss} type="button" onClick={onDismiss} aria-label="Dismiss journey taskbar">×</button>}
      </div>

      <div className={styles.track} aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>

      <div className={styles.body}>
        <ol className={styles.rail} aria-label="Creator journey steps">
          {journey.map((stage, index) => {
            const isCurrent = index === activeIndex && stage.status !== "completed";
            return (
              <li key={stage.id} className={`${styles.step} ${styles[stage.status]} ${isCurrent ? styles.focus : ""}`} aria-current={isCurrent ? "step" : undefined}>
                <span className={styles.node}>{stageIcon(stage)}</span>
                <span className={styles.stepCopy}>
                  <strong>{stage.label}</strong>
                  <span>{statusText(stage.status)}</span>
                </span>
              </li>
            );
          })}
        </ol>

        <div className={styles.actionArea}>
          <div className={styles.actionCopy}>
            <span className={styles.actionEyebrow}>{isWaiting ? "Come back for the next milestone" : isComplete ? "Keep the momentum" : "Next milestone"}</span>
            <strong>{isComplete ? "Share your result" : activeStage?.label ?? "Choose an opportunity"}</strong>
            {activeContext?.deadline && <span className={styles.deadline}>{activeContext.deadline}</span>}
          </div>
          {action?.href ? <Link href={action.href} className={`btn ${action.tone === "secondary" ? "secondary" : ""}`}>{action.label}<ChevronRightIcon width={15} height={15} aria-hidden /></Link> : action?.label && <span className={styles.waitingBadge}>{action.label}</span>}
        </div>
      </div>

      <p className={styles.trustNote}><span aria-hidden>✦</span> Quality progress stays separate from rally momentum. Sharing can amplify your story, not buy the result.</p>
    </section>
  );
}
