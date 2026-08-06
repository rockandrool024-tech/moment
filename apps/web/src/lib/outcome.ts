import { SubmissionWithOutcome } from "./types";

export type OutcomeTone = "winner" | "knockout" | "advanced" | "pending";

/**
 * Shared between the /results page and its opengraph-image so the copy and
 * the card always agree. Knockout gets equal billing to winner per
 * growth-viral-mechanics.md §3: "cards are generated only for wins. Generate
 * them for knockouts too... 20 losers per campaign versus 1 winner is a 20x
 * larger share surface."
 */
export function outcomeTone(submission: SubmissionWithOutcome): OutcomeTone {
  if (submission.isWinner) return "winner";
  if (submission.status === "eliminated") return "knockout";
  if (submission.status === "advanced") return "advanced";
  return "pending";
}

export const OUTCOME_COPY: Record<OutcomeTone, { headline: string; tagline: string }> = {
  winner: { headline: "WINNER", tagline: "Took the whole pool." },
  knockout: { headline: "KNOCKED OUT", tagline: "Go watch who beat them." },
  advanced: { headline: "ADVANCED", tagline: "Still in it." },
  pending: { headline: "IN THE RUNNING", tagline: "Results aren't in yet." },
};
