# ADR-004: Public discovery profiles for creators and brands

**Status:** Proposed
**Date:** 2026-08-04
**Deciders:** Founder (mortadha)
**Affects:** mockup-02 (discovery), mockup-03 (influencer map)

## Context

Discovery was a campaign feed only — search, category chips, and campaign cards showing prize, entry count, and time remaining. Creator stats existed but lived on a separate screen (the hot-creators map and leaderboard in mockup-03), and brands had no public presence at all. A seller's numbers were visible only to that seller, in their own dashboard.

That asymmetry is a problem in a marketplace where creators invest effort before any money moves. A creator deciding whether to enter a challenge is making a bet: spend hours filming, survive peer voting, and hope the brand actually judges the round and pays out. Without any public signal on the brand, that bet is blind — and the creators most able to detect a bad brand (the experienced ones the marketplace most wants to retain) are the ones who will opt out first. Trust signals on the brand side are what let a creator take the bet on an unfamiliar name.

Brands have the mirror-image problem when inviting creators directly (the "invite creators" flow in the production scope): they need to judge a creator on more than a win count.

## Decision

Restructure discovery into three tabs — **campaigns**, **creators**, **brands** — with public stat blocks on the latter two. The mockup-03 map and leaderboard become the creators tab's map view rather than a standalone screen. Add a brand profile page reachable from the brands tab and from any campaign card.

**Public creator stats:** wins, finals rate (share of entered challenges where they reached the final round), brand score (average 1-5 rating from sellers whose campaigns they completed), tier badge, city, category.

**Public brand stats:** campaigns run, total paid out, on-time payout rate, average prize size, and creator rating (average 1-5 from creators who participated), with rating count shown alongside.

## Where the numbers come from

Most map cleanly onto the ADR-001 model, but three require new fields or tables:

| Stat | Source |
|---|---|
| Creator wins | `count(Payout where user_id = X and type = 'winner')` |
| Finals rate | `count(Submission reaching final round) / count(Submission)` per creator |
| Brand campaigns run | `count(Challenge where seller_id = X and status = 'resolved')` |
| Total paid out | `sum(Payout.amount)` across that seller's resolved challenges |
| Avg prize size | `avg(Challenge.prize_pool)` |
| **On-time payout rate** | **needs `Payout.paid_at` plus a `payout_due_at` derived from final round close — neither exists today** |
| **Creator rating / brand score** | **needs a new `Rating` table (`challenge_id`, `rater_id`, `ratee_id`, `direction`, `score`) — no rating entity exists in ADR-001** |

The `Rating` table is bidirectional (creator rates brand, brand rates creator) and should only accept a rating from a participant in a *resolved* challenge, which prevents drive-by ratings from non-participants.

## Trade-offs

**Peer-vote leakage.** Creator stats must be lifetime aggregates only. Exposing a creator's per-challenge peer-vote win rate while a round is live would let observers work backwards toward which anonymized teaser belongs to whom, breaking the blind-comparison guarantee that ADR-003's anti-sabotage design rests on. Per-challenge performance is revealed to the creator themselves (mockup-09 screen 17) and to nobody else until the challenge resolves.

**Cold start.** A brand with zero history has no trust signals, which makes the brands tab actively hostile to new sellers — the opposite of what a two-sided marketplace needs early on. Mitigation: show "first campaign · prize is funded in escrow" instead of empty stat blocks. Escrow funding is a real, verifiable signal available on day one, and it substitutes for track record until track record exists. New brands should never render as a row of zeroes.

**Gaming.** On-time payout rate is hard to game because Stripe timestamps it. Creator rating is softer — a brand could pressure finalists for a good rating. Showing the rating count next to the average gives a reader a way to discount a 5.0 built on three ratings. Coordinated rating abuse is deferred alongside the coordinated-voting detection already on the ADR-003 backlog; both need real data to tune thresholds against.

**Ranking pressure.** Public leaderboards concentrate attention on already-winning creators, which can starve newcomers and hurt marketplace liquidity. The "rising" filter chip is the partial answer, and the map view's geographic spread is another — but if repeat winners start absorbing most entries, ranking weights need revisiting.

## Consequences

- The influencer map is no longer a separate destination; mockup-03 becomes the creators tab's map view and should be re-labelled accordingly.
- Two new persistence requirements (`Payout.paid_at` + due date, `Rating` table) that were not in the ADR-001 schema, plus a post-campaign rating prompt in both the creator and seller flows.
- Brand profiles are public pages, which makes them candidates for the SSR/OG treatment ADR-002 specified for spectator pages — a brand's profile is a plausible share target and a plausible SEO surface.
- On-time payout rate becomes a number the platform is implicitly vouching for. It must be computed from payment-provider timestamps, never from app-side state, or it becomes a liability the first time it is wrong.

## Action items

1. [ ] Add `Payout.paid_at` and a `payout_due_at` derived from final round close
2. [ ] Add the bidirectional `Rating` table, restricted to participants of resolved challenges
3. [ ] Build post-campaign rating prompts for both creator and seller
4. [ ] Re-label mockup-03 as the creators-tab map view
5. [ ] Define the new-brand empty state as escrow-funded proof rather than zeroed stats
6. [ ] Decide whether brand profiles get public SSR pages (ADR-002 treatment) or stay in-app only
