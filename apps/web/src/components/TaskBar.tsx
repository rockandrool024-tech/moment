import Link from "next/link";
import { ChevronRightIcon, CompassIcon, FilmIcon, VoteCheckIcon } from "@/components/icons";
import styles from "./TaskBar.module.css";

interface TaskBarProps {
  liveChallengeHref?: string;
}

const TASKS = [
  { key: "vote", eyebrow: "Keep your streak", title: "Judge a live round", detail: "One focused vote helps the network find better work.", icon: VoteCheckIcon, tone: "live" },
  { key: "story", eyebrow: "Build your story record", title: "Discover an open story", detail: "Claim a brief, make it yours and publish when ready.", icon: FilmIcon, tone: "story" },
  { key: "map", eyebrow: "Find local momentum", title: "Explore the live map", detail: "See public creator and challenge activity by zone.", icon: CompassIcon, tone: "map" },
] as const;

export function TaskBar({ liveChallengeHref = "/challenges" }: TaskBarProps) {
  return (
    <section className={`card ${styles.bar}`} aria-labelledby="task-bar-title">
      <div className={styles.header}>
        <div><span className="page-eyebrow">Your next moves</span><h2 id="task-bar-title">Three things need you.</h2></div>
        <span className="badge badge-accent">Momentum loop</span>
      </div>
      <div className={styles.grid}>
        {TASKS.map((task, index) => {
          const Icon = task.icon;
          const href = task.key === "vote" ? liveChallengeHref : task.key === "story" ? "/stories" : "/map";
          return (
            <Link className={`${styles.task} ${styles[task.tone]}`} href={href} key={task.key} style={{ animationDelay: `${index * 55}ms` }}>
              <span className={styles.icon}><Icon width={18} height={18} aria-hidden /></span>
              <span className={styles.copy}><span className={styles.eyebrow}>{task.eyebrow}</span><strong>{task.title}</strong><span className={styles.detail}>{task.detail}</span></span>
              <ChevronRightIcon className={styles.arrow} width={16} height={16} aria-hidden />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
