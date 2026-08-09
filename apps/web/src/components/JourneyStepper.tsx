import { JourneyMilestone } from "@/lib/types";
import { VoteCheckIcon } from "@/components/icons";
import styles from "./JourneyStepper.module.css";

// Grounded entirely in data that already exists (submissions, votes,
// payouts, tier) — see apps/api/src/modules/identity/journey.ts. Three
// visual states, not two: "current" (the first not-yet-achieved milestone,
// by array order) reads as the next actionable step, distinct from the
// ones still further out — a flat achieved/not-achieved list doesn't tell
// a creator what to actually go do next.
export function JourneyStepper({ milestones }: { milestones: JourneyMilestone[] }) {
  const currentIndex = milestones.findIndex((m) => !m.achieved);

  return (
    <div className={styles.wrap}>
      {milestones.map((m, i) => {
        const state = m.achieved ? "done" : i === currentIndex ? "current" : "locked";
        return (
          <div key={m.key} className={styles.step}>
            <div className={styles.line} />
            <span className={`${styles.node} ${styles[state]}`} aria-hidden>
              {state === "done" ? <VoteCheckIcon width={13} height={13} /> : i + 1}
            </span>
            <div className={styles.textCol}>
              <div className={`${styles.label} ${state !== "done" ? styles[state] : ""}`}>{m.label}</div>
              {state === "current" && <div className={styles.sub}>next up</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
