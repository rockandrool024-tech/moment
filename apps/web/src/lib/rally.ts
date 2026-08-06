const RALLY_KEY = "moment.rallyCode";

// Persists across the login redirect so the rally attribution can be
// recorded once the visitor actually casts a vote (see PublicVote in
// app/rounds/[id]/page.tsx) — mirrors the JWT persistence pattern in
// api-client.ts.
export function getRallyCode(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(RALLY_KEY);
}

export function setRallyCode(code: string): void {
  window.localStorage.setItem(RALLY_KEY, code);
}
