# Perokio

*(formerly MOMENT — renamed 8 August 2026. Same product, same locked decisions below; a `Story`
model was added as an additive generalization of `Challenge` — see `TODO.md` — without reopening
any of them, including the explicitly rejected CPM/off-platform-distribution mechanics.)*

**Status: v1 LOCKED — 5 August 2026**
Scope below is frozen. Changes require a new ADR, not an edit to an existing one.

---

## What it is

A two-sided marketplace where brands post content challenges with escrowed cash prizes, and creators compete through elimination rounds. The winner takes the pool, and eighteen other creators still leave with money.

The product is not a content app with a payout feature. It is **a payout event that generates content, spectators, and its own marketing.**

---

## How to read this folder

Start here, in order:

| File | What it gives you |
|---|---|
| `README.md` | This file. Scope, decisions, blockers, build order. |
| `moment-prototype.html` | **The reference implementation.** 37 screens, interactive. Open in a browser; there's an "All screens" toggle for review. |
| `docs/prototype-screen-index.md` | What each of the 37 screens is for, and which mechanic it serves. |
| `docs/ADR-001` … `ADR-005` | The five architecture decisions, in dependency order. |
| `docs/growth-viral-mechanics.md` | Growth model, k math, retention targets, unit economics. |
| `docs/production-app-scope.md` | Everything needed beyond the mocked screens to reach production. |
| `docs/mockup-01` … `mockup-09` | Early wireframes. Superseded by the prototype — reference only. |
| `docs/prompt-v2-journey-and-3d-map.md` | **Backlog. Not in scope.** A v2 direction that was explored and set aside. |

If you only read two things: the prototype and ADR-005.

---

## The v1 product

**Three-stage funnel** (ADR-003)

1. **Teaser round** — creators submit a ≤15s teaser. Blind *pairwise* peer voting: two anonymised teasers side by side, never one alone. Picking is blocked for the first 3 seconds of playback, and one pair per deck repeats as an attention check. A creator must cast 8 votes before their own result unlocks. The brand adds a light 1–5 score. Composite is 70% peer, 30% brand.
2. **Full content** — survivors produce the complete piece. Peer voting narrows to a final four.
3. **Public final** — blind verified-audience vote, brand makes the final call.

**Economics** (ADR-005) — verified, stable across pool sizes

| Component | Formula | At a $5,000 pool |
|---|---|---|
| Winner prize | the pool | $5,000 |
| Finalist stipends | 12% of pool, 4 ways | $150 each |
| Round-2 survivor bonus | 6% of pool across survivors | $25 each |
| Crowd favourite | 5% of pool, floor $50, **platform-funded** | $250 |
| Platform fee | 20% gross → **10.2% net** after bonus and Stripe | $1,180 → $724 |

**13 of 32 entrants get paid (41%).** Internal models use 10% net, not 20% gross. The 20% is what the brand sees on the invoice; it is not margin.

**Growth** (growth-viral-mechanics.md) — five loops. The rally loop dominates, and the two-currency split is what keeps it from corrupting the contest:

- **Quality score** — blind votes from a pool that did not arrive via the competing creator's link. Decides the prize.
- **Rally score** — votes from a creator's own attributed link. Earns XP and the crowd-favourite bonus. Never the prize.

Attribution taint is scoped **per creator**, not globally: a voter recruited by `@x` can never cast quality votes where `@x` competes, and is a valid quality voter everywhere else immediately. A global taint would starve the judging pool as the growth loop succeeded.

---

## Decisions locked

| # | Decision | Where |
|---|---|---|
| 1 | Modular monolith, not microservices | ADR-001 |
| 2 | React Native (Expo) + Next.js, Node/TS, Postgres, Redis + BullMQ | ADR-001 |
| 3 | Stripe Connect for escrow and payouts; Mux for video; phone OTP for voting | ADR-001 |
| 4 | 20% take rate via `application_fee_amount`; AI credits as a second line | ADR-002 |
| 5 | Public spectator mode server-rendered, on a separate cached API surface | ADR-002 |
| 6 | Blind **pairwise** peer voting — the anti-sabotage guardrail | ADR-003 |
| 7 | Vote-to-unlock participation gate (8 votes) | ADR-003 |
| 8 | Discovery is three tabs: campaigns, creators, brands | ADR-004 |
| 9 | Public brand trust stats, including on-time payout rate | ADR-004 |
| 10 | Two-currency rally split | ADR-005 |
| 11 | Per-creator scoped attribution taint | ADR-005 |
| 12 | Crowd favourite proportional (5%, floor $50) | ADR-005 |
| 13 | Round-2 survivor bonus | ADR-005 |
| 14 | Predictions and taste score for non-entrants | ADR-005 |

## Explicitly rejected

- **CPM / pay-per-view payouts.** Reach would convert directly to cash, which reverses the two-currency split and makes the on-screen promise that followers can't buy the win false. v1 pays a prize pool.
- **Swipe like/dislike voting.** Absolute rating is the gameable form and produces no head-to-head data.
- **Off-platform-only distribution.** Empties the bracket and spectator feed, which are loops 4 and 5.
- **Streak-freeze paywalls, loot boxes, any purchasable advantage near the prize.** See the legal blocker below.

---

## Blockers and open questions

**Launch blocker — sweepstakes and gambling exposure.** Unresolved. Entry must be free, the outcome must be defensible as skill-determined, and the peer-vote mechanic needs to survive that test jurisdiction by jurisdiction. This blocks the terms of service *and* the payout logic. It is not a sprint-8 problem. Get an opinion before ToS is written.

**Open, non-blocking**

1. Non-participation penalty for round-1 peer voting — currently ×0.9 composite, still a placeholder
2. Take rate on in-person vs digital campaigns — 12% local vs 20% flat, both appear in the prototype
3. Coordinated-voting detection thresholds — queue is built, thresholds need real data
4. Fallback when one creator holds more than ~15% of attribution edges — pool assignment would need to widen geographically
5. Follower-location data for influence zones is coarse city-level aggregates only, for connected business accounts. Design for approximation.
6. Publicly rendering audience geography needs a privacy review and creator opt-in

---

## Build order

**Phase 1 — the spine**
Postgres schema for the core entities. Stripe Connect escrow and payout in sandbox. Mux upload and playback. The round state machine as a queued job (open → close → tally → reveal). Phone OTP on the voting endpoint.

The round state machine is the crux. Build it carefully once — it is the mechanic the whole product's game feel depends on.

**Phase 2 — the competition**
Teaser submission. Blind pairwise deck with the 3-second gate and attention check. Participation gate on result reveal. Brand light-score UI. Composite scoring.

**Phase 3 — money and trust**
All four payout types including the survivor bonus and crowd favourite. `Payout.paid_at` and the derived due date. The bidirectional `Rating` table. Brand trust ledger. KYB flow.

**Phase 4 — growth**
`RallyAttribution` with per-creator scoped exclusion. Quality-pool assignment at round open. Server-side share cards. Public SSR spectator pages with Open Graph tags. Referral attribution.

**Phase 5 — the invisible half**
Admin console, dispute resolution, coordinated-vote detection, round-schedule repair, god-view of campaign state. This is the highest-leverage work nobody sees. Competition products live or die on trust, and trust breaks fastest when there's no way to fix a bad round quickly.

---

## Targets to hold the team to

| Metric | Target | Mechanism |
|---|---|---|
| D1 | 45% | vote-to-unlock |
| D7 | 28% | a round resolves every 2–3 days |
| D30 | 15% | one payout event in month one |
| k (7d rolling) | ≥ 0.6 before any paid spend | rally + cards + referral |
| Entries per campaign | ≥ 20 | below this the format stops working |

Two numbers matter most: **vote-deck completion rate** (retention, integrity and engagement in one) and **brand repeat rate** (the only real proof of product-market fit on the paying side).

**Hard rule:** no paid acquisition until k ≥ 0.6. Paid spend on a broken loop converts money into uninstalls.
