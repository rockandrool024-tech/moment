import { JourneyMilestone } from "@/lib/types";
import { VoteCheckIcon } from "@/components/icons";

// Grounded entirely in data that already exists (submissions, votes,
// payouts, tier) — see apps/api/src/modules/identity/journey.ts.
export function JourneyStepper({ milestones }: { milestones: JourneyMilestone[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {milestones.map((m) => (
        <div key={m.key} style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {m.achieved ? (
            <VoteCheckIcon width={18} height={18} style={{ color: "var(--accent)", flexShrink: 0 }} aria-hidden />
          ) : (
            <span
              aria-hidden
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: "1.5px solid var(--border)",
                flexShrink: 0,
              }}
            />
          )}
          <span className={m.achieved ? undefined : "muted"} style={{ fontSize: "0.92rem" }}>
            {m.label}
          </span>
        </div>
      ))}
    </div>
  );
}
