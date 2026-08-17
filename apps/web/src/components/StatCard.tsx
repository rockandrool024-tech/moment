import { ReactNode } from "react";
import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: ReactNode; // plain string, or <CountUp value={n} format={...} /> for an animated reveal
  icon?: ReactNode;
  verdict?: { text: string; tone: "good" | "warn" | "bad" };
}

// The one big-number-per-card pattern from docs/design-system.md §3.6 —
// replaces plain <p style={{fontSize:"2rem"}}> one-offs (wallet balance,
// streak count) with a single shared component so they stay consistent.
export function StatCard({ label, value, icon, verdict }: StatCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.top}>
        <span className={styles.label}>
          {icon}
          {label}
        </span>
        {verdict && <span className={`${styles.verdict} ${styles[verdict.tone]}`}>{verdict.text}</span>}
      </div>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
