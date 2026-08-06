# MOMENT — Viral mechanics and growth design

**Companion to:** `moment-prototype.html` (30 screens, full loop, both sides)
**Date:** 4 Aug 2026
**Status:** Accepted — prototype built against sections 2.3, 3, 4 and 5

---

## 0. The one thing that matters

The share card is not the growth engine. It's an amplifier with a weak multiplier.

The actual engine is this:

> **A creator competing for $5,000 will market the app harder than the platform ever will — because they're marketing themselves.**

Every creator who reaches round 2 has a direct, urgent, personal financial reason to send their existing audience to the app *this week*. That is unpaid distribution with an 8–12% click-through rate, because it isn't an ad — it's a friend asking for a favour.

Everything below is built around making that solicitation loop as strong, and as un-corrupting, as possible.

---

## 1. The honest math on "1M users in a month"

Viral growth compounds as:

```
Cumulative users = seed × (k^(n+1) − 1) / (k − 1)
where n = number of viral cycles in the period
```

To reach 1,000,000 in 30 days, with a 3-day cycle time (10 cycles) and a 10,000-user seed:

| Sustained k | Users at day 30 |
|---|---|
| 0.8 | ~50,000 |
| 1.0 | ~110,000 |
| 1.2 | ~320,000 |
| **1.4** | **~990,000** |
| 1.6 | ~2,900,000 |

**The literal answer: a sustained k ≈ 1.4 with a 3-day cycle and 10k seeded users.**

For calibration, k ≈ 1.4 sustained over 30 days is higher than Dropbox (~0.6), higher than PayPal's referral peak, and in the territory of Clubhouse's invite spike and Wordle's share-grid moment — both of which decayed hard within 90 days.

**Read:** 1M in 30 days is achievable *only* as a launch spike (invite scarcity + a paid seed + one culturally-loud campaign), and it will not hold. 1M *active* in 90 days at k ≈ 0.9 plus paid top-up is the harder, better, more defensible goal — and it survives contact with retention.

This document optimises k **and** D30 simultaneously, because k without retention is a firework.

---

## 2. Where k actually comes from

### 2.1 The weak loop: share cards

Per 32-entry campaign:

| Step | Value | Source |
|---|---|---|
| Share-worthy moments (advance + finalist + win) | 17 | 12 advance + 4 finalists + 1 winner |
| Share rate | 40% | it's a flex *and* it's money |
| Cards posted | 6.8 | |
| Impressions per card | ~900 | mid-tier creator, story/post |
| CTR to public page | 2% | passive scroll |
| Visit → signup | 12% | no-login watch, gate only at vote |
| **Signups** | **≈ 15** | |

**k from share cards alone ≈ 0.47.** Real, but not viral.

### 2.2 The strong loop: the vote rally

Per 32-entry campaign, once round 2 opens:

| Step | Value | Why |
|---|---|---|
| Creators with live skin in the game | 12 | R2 survivors |
| Avg reachable audience | 3,000 | modest for an entering creator |
| Impressions of a "vote for me" ask | 36,000 | personal, urgent, deadline-bound |
| CTR | 8% | it's a favour, not an ad |
| Visits | 2,880 | |
| Visit → signup (vote gate at peak intent) | 15% | |
| **Signups** | **≈ 432** | |

**The 8% CTR is the ceiling, not the estimate.** Story-link CTR normally runs 1–3%; a personal ask from someone you follow plausibly reaches 5%. The loop's output is roughly linear in this number:

| CTR | Signups per campaign | vs assumption |
|---|---|---|
| 2% | 108 | ÷4 |
| 3% | 162 | ÷2.7 |
| 5% | 270 | ÷1.6 |
| **8% (assumed above)** | **432** | — |

Plan against 3–5% and treat 8% as the upside case. Measure it in week one — it is the cheapest number to learn and the most expensive to be wrong about.

**Normalising per user.** The per-campaign figure of 13.5 is not k; k is signups per *existing active user* per cycle. With 32 entrants and roughly 120 engaged users orbiting a campaign (entrants, their returning voters, spectators), 432 signups at 8% CTR gives k ≈ 3.6 for the campaign's own cohort — but only a fraction of the userbase is attached to a live campaign at any moment. At a realistic 15–25% of actives attached to a campaign in a given cycle, the blended contribution is **k ≈ 0.5–0.9 at 8% CTR, and k ≈ 0.2–0.35 at 3%**.

That is the honest headline: the rally loop is the strongest of the five and still does not reach 1.4 on its own. Combined with the other four loops it plausibly clears 0.9. Reaching 1.4 requires the launch spike — invite scarcity, a paid seed, and one culturally loud campaign — which is exactly why §1 concludes 1M in 30 days is a spike, not a sustained state.

**Design conclusion: vote solicitation is a first-class product surface, not a side effect.**

- Every finalist gets a **personal vote link** (`moment.app/v/momo24`) with attribution tracking
- A **"your voters" counter** on their dashboard — visible, climbing, addictive
- **Rally XP** for votes arriving through that link
- Pre-built rally assets: a countdown story sticker, a "2 hours left" card, a caption

### 2.3 But this breaks the vote — and here's the fix

If bringing your own audience wins the money, this is a follower-count contest, not a content contest. The best creator with 400 followers loses to a mediocre one with 40,000. Word gets out in two weeks and creator supply dies.

**Resolution — split the signal into two currencies:**

| Currency | What it measures | What it decides |
|---|---|---|
| **Quality score** | Blind votes from a *randomly assigned* verified pool who did not arrive via a creator link | Who wins the prize |
| **Rally score** | Votes from your own attributed link, hard-capped | XP, tier progress, a separate cash bonus |

**Rallying earns status and a bonus, never the prize.** The creator still has every reason to market hard, the contest stays honest, and the platform can say so publicly — which is itself a marketing asset ("your followers can't buy you the win here").

The rally gets a real prize of its own: **"Crowd favourite"** — 5% of the pool, minimum $50, paid from the platform fee. Two winners per campaign, two share moments, zero corruption of the main vote.

**It has to be proportional, not flat.** A fixed $250 against a percentage fee goes negative below roughly a $1,500 pool — at a $900 pool the platform nets −$102 — and $900 local campaigns are exactly what §6 says to launch with. Priced at 5% with a floor, net take holds at a stable 10.2% of brand spend from $900 to $10,000.

**And the pool doesn't starve.** Excluding rally-arrivals from quality voting *globally* would shrink the judging pool as the loop succeeds. The exclusion is instead scoped per creator: a voter recruited by `@momo24` can never cast quality votes in campaigns where `@momo24` competes, and is a valid quality voter everywhere else immediately. See ADR-005.

---

## 3. The five loops, stacked

| # | Loop | Trigger | k contribution | Cycle |
|---|---|---|---|---|
| 1 | **Rally** | Round opens, deadline visible | high | 2–3 days |
| 2 | **Result card** | Advance / win / knockout | 0.4–0.5 | 1 day |
| 3 | **Referral** | Post-win, post-payout | 0.2–0.3 | 7+ days |
| 4 | **Spectator → creator** | Watched 3 finals, saw the money | 0.15 | 5–10 days |
| 5 | **Brand → audience** | Brand posts winner to its own channels | 0.1 | per campaign |

**Loop 2 has an unused half:** cards are generated only for *wins*. Generate them for **knockouts** too.

> *"I got eliminated in round 2 of a $5,000 challenge. Go watch the person who beat me."*

Losing publicly, with humour, is more shareable than winning — it's the entire comedic grammar of Gen-Z content. 20 losers per campaign versus 1 winner is a 20× larger share surface.

---

## 4. The Gen-Z layer

Loud, but every element load-bearing:

**Stakes you can see.** The dollar number is the biggest text on every screen. Not "prizes available" — `$5,000`, in tabular numerals, with a live countdown under it. Money as typography.

**A visible clock on everything.** Rounds close. Decks expire. Streaks die. Nothing is available forever. Urgency is the difference between a feed and an event.

**Public elimination.** 32 → 12 → 4 → 1, shown as a bracket everyone can watch. Brackets are inherently spectator content — March Madness proved it, and no one has put it on top of creator payouts.

**The knockout is content.** Auto-generate a roast-tone elimination card. Let the person who beat you get tagged. Rivalry is retention.

**One-human-one-vote as a flex.** "Verified vote" is a trust feature *and* a status marker. Say it loudly.

**Tiers with real teeth.** Bronze → Silver → Gold → Platinum unlock actual things: higher-pool challenges, earlier access, lower AI credit cost. Cosmetic tiers are ignored by this audience; functional ones are grinded.

**Streaks on voting, not posting.** Posting streaks punish people who have nothing to post. Voting streaks are always satisfiable in 30 seconds — exactly the property wanted in a daily-active driver.

**Local as identity.** "12 challenges near you" and a city leaderboard. Gen-Z virality is geographic before it's global — it moves campus by campus, city by city. The geo-map and in-place shoots are not a feature, they're the go-to-market.

**What to leave out:** streak-freeze paywalls, loot boxes, anything resembling gambling near real money. The product is already close enough to a sweepstakes line to need a legal opinion — don't hand a regulator extra rope.

---

## 5. Retention

k is meaningless if D30 is 4%. Design targets:

| Metric | Target | Mechanism |
|---|---|---|
| D1 | 45% | vote-to-unlock — your result is *hostage* until you return and vote |
| D7 | 28% | round cadence: something resolves every 2–3 days |
| D30 | 15% | at least one payout event (prize, stipend, referral, or crowd bonus) in month one |
| Sessions/week | 5+ | deck expiry + streak + local alerts + rival notifications |

**The highest-leverage retention mechanic already in the spec is vote-to-unlock.** It is the reason a creator returns the day after submitting instead of forgetting the app for a week.

**But it only works for people who entered.** Vote-to-unlock holds your *own result* hostage — and the majority of rally arrivals verify, vote once, and never submit anything. They have no result, no streak worth defending, and no reason to return. Growth acquires voters; retention was built for entrants. Non-entrants therefore get **predictions**: pick who survives, locked until the round closes, scored into a public taste score that unlocks early access and greater weight in the quality pool. Same hostage structure, no submission required (ADR-005).

**The second mechanic is: pay far more than one person.** "Everyone who reaches the final gets paid" is 4 of 32 — 16% including the crowd favourite, which means a creator needs three entries for a coin-flip chance of ever seeing money. Adding a **round-2 survivor bonus** (6% of pool, split across the ~12 survivors, $25 each at a $5,000 pool) takes it to 13 of 32:

| | Old | With survivor bonus |
|---|---|---|
| Paid per campaign | 5 of 32 (16%) | 13 of 32 (41%) |
| P(paid) after 2 entries | 29% | 65% |
| P(paid) after 3 entries | 40% | 79% |

Since D30 is mechanised on "one payout event in month one," this is the difference between the 15% target being reachable and being arithmetic fiction.

**Guard the vote gate.** Tapping through eight pairs in fifteen seconds to unlock your result was free, and it pollutes the exact signal that decides round 1. Picking is disabled for the first 3 seconds of playback, and one pair per deck repeats an earlier pair as an attention check.

**Pause streaks on supply failure.** In a one-city, ten-brand launch there will be days with no eligible deck. A streak broken by your own thin marketplace is worse than no streak — so it pauses and says so. Not a purchasable freeze; §4 rules those out.

Consider a **$5 first-vote-deck bonus**, withdrawable only after a second campaign. It costs a few dollars per activated creator, converts "downloaded an app" into "earned money on an app," and that phrase is what they say to their friends.

---

## 6. Cold start — the first 1,000 users

Virality is multiplication, and multiplication needs something non-zero to work on.

**Weeks 1–2: one city, one lane.** Pick a single city (Tunis is a real advantage — dense, under-served, low CAC, high creator density per dollar) and a single vertical (food and beverage). Do not launch nationally. A thin marketplace across ten cities is ten dead marketplaces.

**Seed the brand side by hand.** 10 local businesses. Subsidise the first pool if necessary — a $1,000 prize funded internally is cheaper than any paid acquisition campaign that produces 400 engaged creators.

**Recruit 50 creators personally.** Not 5,000. Fifty, by DM, who will actually enter. A campaign with 40 entries feels alive; one with 6 feels dead, and dead is contagious in the other direction.

**Manufacture the first spectacle.** Run one campaign with an outsized pool ($10,000) and an absurd, screenshot-native brief. It is a marketing expense, not a prize. Its job is to produce the first 200 share cards and the first press-shaped story.

**Then, and only then, open the second city** — using geo-map coverage gaps as the target list.

---

## 7. 90-day plan

| Phase | Days | Goal | Success gate |
|---|---|---|---|
| **Seed** | 1–14 | 1 city, 10 brands, 500 creators | ≥40 entries on campaign #1 |
| **Loop** | 15–35 | Rally links, knockout cards, personal vote pages live | k ≥ 0.6, D7 ≥ 25% |
| **Spike** | 36–50 | $10k flagship campaign + invite scarcity + press | 100k signups in 14 days |
| **Expand** | 51–75 | 5 cities off geo-map gaps | k ≥ 0.9, brand repeat rate ≥ 40% |
| **Scale** | 76–90 | Paid top-up on top of a proven loop | 1M cumulative, D30 ≥ 15% |

**Hard rule:** no paid acquisition before day 36. Paid on top of a broken loop is a machine for converting money into uninstalls. The day-35 gate is real — if k < 0.6, fix the loop, don't buy users.

---

## 8. What actually kills this

| Risk | Severity | What to do about it |
|---|---|---|
| **Legal — sweepstakes / gambling** | Existential | Get an opinion *now*, before ToS is written. Entry must be free, outcome must be skill-determined, and the peer-vote mechanic needs to be defensible as skill. Jurisdiction by jurisdiction. This blocks launch, not sprint 8. |
| **Loser churn** | High | 31 of 32 lose. Without the finalist stipend and the knockout card, they leave and never return. The stipend is the single best decision in the current spec — protect its budget. |
| **Brand side is the bottleneck** | High | Creators are free and infinite. Funded brands are neither. Every growth dollar is worth more on the brand side. Consider a lower take rate (12%) for local in-place challenges to buy supply. |
| **Rally corrupts the vote** | High | Solved by the two-currency split in §2.3. Do not ship rally links before that split exists. |
| **Vote fraud at scale** | Medium | Add device attestation, phone verification for voting rights, velocity caps. Coordinated-ring detection needs real data — ship thresholds, tune later. |
| **First-mover imitation** | Medium | The moat is not the mechanic, it's the trust ledger — Stripe-verified payout history a competitor cannot fabricate on day one. Make the trust page the most-linked surface in the product. |

---

## 9. The dashboard — 8 numbers, nothing else

1. **k** (signups attributable to existing users / active users), rolling 7d
2. **Cycle time** (invite sent → invitee's first action)
3. **D1 / D7 / D30**
4. **Vote-deck completion rate** — the leading indicator for everything
5. **Entries per campaign** — marketplace liquidity; below 20 the format stops working
6. **Brand repeat rate** — the only real proof of product-market fit on the paying side
7. **Time to first payout** per creator cohort
8. **Flagged-vote rate** — integrity early warning

If only two: **vote-deck completion** (retention + integrity + engagement in one number) and **brand repeat rate** (revenue).

---

## 10. Open decisions

| # | Decision | Status |
|---|---|---|
| 1 | Non-participation penalty — composite ×0.9? | **Shipped in prototype** as ×0.9, still needs a real call |
| 2 | Coordinated-voting detection — MVP thresholds or defer? | Deferred, admin console has the queue stub |
| 3 | Sweepstakes legal opinion | **Blocking. Not resolvable in design.** |
| 4 | Rally split (§2.3) | **Resolved — two-currency model, built** |
| 5 | Take rate on in-place vs digital — 20% flat or 12% local? | 12% local shown in the prototype wizard; **still open** |
| 6 | Knockout cards — v1 or after win-card measurement? | **Resolved — shipped in v1** |
| 7 | Quality-pool eligibility as rally scales | **Resolved — per-creator scoped taint (ADR-005)** |
| 8 | Crowd favourite pricing | **Resolved — 5% of pool, floor $50** |
| 9 | Retention for non-entrants | **Resolved — predictions and taste score** |
| 10 | Fallback when one creator holds >15% of attribution edges | **Open** — pool assignment would need to widen geographically |

---

## 11. Corrected unit economics

The "20% take rate" is gross. After the crowd-favourite bonus and Stripe processing, net take is **10.2% of brand spend**, stable across pool sizes:

| Pool | Brand pays | Gross fee | Crowd fav | Net to platform | Real take |
|---|---|---|---|---|---|
| $900 | $1,274 | $212 | $50 | $125 | 9.8% |
| $2,000 | $2,832 | $472 | $100 | $290 | 10.2% |
| $5,000 | $7,080 | $1,180 | $250 | $724 | 10.2% |
| $10,000 | $14,160 | $2,360 | $500 | $1,449 | 10.2% |

Internal models, runway, and CAC payback should use 10%, not 20%. The 20% figure is what the brand sees on their invoice and is fine as external positioning — it just isn't margin.

---

### One-line summary

This is not a content app with a payout feature. It is **a payout event that generates content, spectators, and its own marketing** — and the fastest path to a million people is to stop optimising the share button and start optimising the two hours before a round closes, when twelve creators are begging their followers to come to the app.
