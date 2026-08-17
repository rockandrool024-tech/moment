import styles from "./Celebration.module.css";

// A one-shot particle burst for a genuine "you won" moment — not a fake
// urgency/engagement trick, just real positive feedback tied to a real
// outcome (SubmissionWithOutcome.isWinner). Fixed particle set (no
// Math.random()) so it renders identically on server and client with no
// hydration mismatch, and needs no client-side JS/hooks at all.
const PARTICLES = [
  { rot: 20, dist: -70, color: "var(--accent)", delay: 0 },
  { rot: -35, dist: -85, color: "var(--tier-2)", delay: 40 },
  { rot: 60, dist: -60, color: "var(--fg)", delay: 80 },
  { rot: -80, dist: -75, color: "var(--accent)", delay: 60 },
  { rot: 110, dist: -55, color: "var(--tier-2)", delay: 20 },
  { rot: -140, dist: -70, color: "var(--fg)", delay: 100 },
  { rot: 160, dist: -65, color: "var(--accent)", delay: 30 },
  { rot: -20, dist: -90, color: "var(--tier-2)", delay: 70 },
  { rot: 200, dist: -60, color: "var(--fg)", delay: 10 },
  { rot: -200, dist: -80, color: "var(--accent)", delay: 90 },
  { rot: 250, dist: -55, color: "var(--tier-2)", delay: 50 },
  { rot: -250, dist: -70, color: "var(--fg)", delay: 110 },
];

export function Celebration() {
  return (
    <div className={styles.burst} aria-hidden>
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={styles.particle}
          style={
            {
              "--p-rot": `${p.rot}deg`,
              "--p-dist": `${p.dist}px`,
              "--p-color": p.color,
              "--p-delay": `${p.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
