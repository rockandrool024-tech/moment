# MOMENT prototype — screen index

**File:** `moment-prototype.html` (open in any browser)
**37 screens · 4 surfaces · clickable, with a built-in "All screens" grid view for review and printing**

Each screen names the mechanic it exists to serve. Anything that didn't earn a mechanic didn't get built.

---

## Creator (21)

| # | Screen | Mechanic it serves |
|---|---|---|
| 1 | Splash · role pick | Money as typography — the pool is the largest element on screen |
| 2 | Verify · one human one vote | Verified voting as a status flex, not a compliance chore (§4) |
| 3 | Home · stakes and streak | Locked-result banner + streak; the two D1 drivers on one screen |
| 4 | Discovery · 3 tabs | Campaigns / creators / brands (ADR-004), brand trust inline on every card |
| 5 | Local · city as identity | Geo map + city leaderboard — the go-to-market, not a feature (§4, §6) |
| 6 | In-person · book and check in | Slot booking, QR check-in, no-show policy, 12% local take rate |
| 7 | Trust ledger · brand profile | The moat: Stripe-verified payout history a rival can't fabricate (§8) |
| 8 | Challenge brief | Escrow proof + all four payout tiers before entry |
| 9 | Teaser submit | 15s gate — nobody burns a weekend on a maybe (ADR-003) |
| 10 | Vote deck · gated and blind | **Vote-to-unlock**, now with 3s minimum view and a repeat-pair attention check |
| 11 | Round result · advanced | Composite shown transparently: 70% peer, 30% brand |
| 12 | Round 2 · full content | Survivor bonus made explicit before the work starts |
| 13 | Rally · two-currency split | **§2.3.** Quality decides the prize; rally earns XP and the bonus |
| 14 | Bracket · public elimination | 32 → 12 → 4 → 1 as spectator content (§4) |
| 15 | Predict · retention for non-entrants | Vote-to-unlock's structure for people who never submit (ADR-005) |
| 16 | Knockout card · loss as content | The unused half of loop 2 — 20 losers vs 1 winner (§3) |
| 17 | Dispute · appeal an elimination | Trust breaks fastest when a bad round can't be fixed |
| 18 | Notifications · rivalry and urgency | Deadline, rival, money, or 400m away. Never "someone liked your post" |
| 19 | Wallet · first payout | Time-to-first-payout; the $5 first-deck bonus (§5) |
| 20 | Tiers · functional not cosmetic | Tiers unlock real things; voting XP is the daily-satisfiable one |
| 21 | Creator profile | Public stats per ADR-004 — lifetime aggregates only, never per-round |

## Brand (9)

| # | Screen | Mechanic it serves |
|---|---|---|
| 22 | Brand home | Repeat rate is the real PMF signal (§9) |
| 23 | KYB · verify the business | Gate before funding; the badge roughly doubles entries |
| 24 | Campaign wizard · brief | Checklist builder driving the round-1 auto-filter |
| 25 | Escrow funding | Four payout tiers itemised; crowd favourite explicitly not brand cost |
| 26 | Judging · light score | 1–5 quick rate replacing manual review (ADR-003) |
| 27 | Round 3 · your final call | The one point where the brand decides alone |
| 28 | Campaign analytics | Surfaces the 61k unpaid rally views — what makes the fee defensible |
| 29 | Invite creators | Pulls from leaderboard; flags the cheapest next city |
| 30 | AI studio · credits | Second revenue line, moderated output (ADR-002) |

## Public (4)

| # | Screen | Mechanic it serves |
|---|---|---|
| 31 | Spectator feed · no login | Watch free, gate only at the vote — loop 4 |
| 32 | Battle page · vote gate | Where a rally link lands; states the split to the arriving voter |
| 33 | Win card · share asset | Loop 2, the half that already existed |
| 34 | Referral | Reward on first *entry*, not signup — empty accounts pay nobody |

## Ops (3)

| # | Screen | Mechanic it serves |
|---|---|---|
| 35 | Admin · moderation | Flags, KYB queue, coordinated-ring detection, round state god-view |
| 36 | States · empty, loading, error | Supply-failure empty state, skeletons, and money-safe error copy |
| 37 | Growth · the 8 numbers | §9 dashboard. Shows rally at 63% of acquisition |

---

## What's wired, not just drawn

- **Vote gate** — 8 blind pairwise votes unlock the result. Picking is blocked for 3 seconds of playback; an attention check fires on vote 5.
- **Two-currency split** — rally votes increment a separate counter and never touch the quality score.
- **Live countdowns** across splash, home, submit, bracket, battle, rally.
- **Discovery tabs** and **prediction picks** both hold state.
- **Reset state** returns everything to first-run.

## Economics as built

| Component | Formula | At $5,000 |
|---|---|---|
| Winner | the pool | $5,000 |
| Finalist stipends | 12% of pool, 4 ways | $150 each |
| Round-2 survivor bonus | 6% of pool across survivors | $25 each |
| Crowd favourite | 5% of pool, floor $50, from platform fee | $250 |
| Platform fee | 20% gross → **10.2% net** after bonus and Stripe | $1,180 → $724 |

13 of 32 entrants get paid (41%, up from 16%).

## Deliberately absent

Streak-freeze paywalls, loot boxes, and any purchasable advantage near the prize. §8 calls the sweepstakes exposure existential — nothing here hands a regulator extra rope.

## Positions taken

| Decision | Position |
|---|---|
| Rally split | Two-currency, built throughout |
| Quality-pool eligibility | Per-creator scoped taint, not global (ADR-005) |
| Crowd favourite | 5% of pool, floor $50, platform-funded |
| Loser churn | Round-2 survivor bonus, 41% of entrants paid |
| Non-entrant retention | Predictions and taste score |
| Knockout cards | Shipped in v1 |
| Non-participation penalty | ×0.9 composite — **still a placeholder** |
| Take rate, local vs digital | 12% local vs 20% flat — **both shown, unresolved** |
| Sweepstakes legal opinion | **Not resolvable in design. Blocks ToS and payout logic.** |
