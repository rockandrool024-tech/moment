# ADR-005: Rally attribution, quality-pool eligibility, and prize economics

**Status:** Proposed
**Date:** 2026-08-04
**Deciders:** Founder (mortadha)
**Builds on:** the two-currency split in `growth-viral-mechanics.md` §2.3
**Affects:** ADR-001 (round state machine), ADR-002 (take rate), `moment-prototype.html`

## Context

The growth design introduced personal rally links: a competing creator sends their own audience to vote, and those votes are separated from the votes that decide the prize. The split itself was decided. Three consequences of it were not, and all three surfaced as the prototype was built.

**First, the quality pool appeared to eat itself.** If prize-deciding votes come only from users who "did not arrive via a creator link," and rally becomes 63% of acquisition as the growth model projects, then the share of the userbase eligible to decide prizes shrinks continuously. Taken literally, the better the growth loop works, the fewer people are allowed to judge — and the pool ends up drawn from an ever-more-tenured minority.

**Second, retention was designed for entrants while growth acquires voters.** Vote-to-unlock is the strongest retention mechanic in the product, and it works by holding a creator's *own result* hostage. Someone who arrived through a rally link, verified, voted once, and never entered a challenge has no result to hold hostage, no streak worth defending, and no reason to open the app the next day. That describes most of the traffic the rally loop produces.

**Third, the crowd-favourite bonus was unpriced.** A flat $250 paid out of a percentage-based platform fee inverts below roughly a $1,500 pool — precisely the local food-and-drink tier the cold-start plan targets. At a $900 pool the platform nets **−$102** per campaign.

## Decision

### 1. Attribution taint is scoped per creator, not global or permanent

A user who arrives via `@momo24`'s rally link is **permanently ineligible to cast quality votes in any campaign where `@momo24` is competing**. They are a fully valid quality voter in every other campaign, immediately, with no waiting period.

This is the whole fix. The exclusion that matters is the one between a voter and the specific creator who recruited them — that's where the bias lives. A global taint throws away the voter entirely and starves the pool; a per-creator taint removes exactly the compromised signal and keeps everything else.

Attribution is stored as an edge, not a flag on the user: `RallyAttribution(voter_id, creator_id, campaign_id, created_at)`. Quality-pool assignment for a campaign excludes any voter holding an attribution edge to any creator still active in that campaign. Edges never expire — a follower recruited a year ago is still that creator's follower.

**Consequence worth naming:** a mega-creator who recruits a large share of the userbase progressively shrinks the pool available to judge *their own* campaigns. That's the correct incentive — it makes their quality score harder to influence, not easier — but if any single creator's attribution edges ever exceed ~15% of the active voter base, campaign assignment needs to fall back to a wider geography rather than a thinner pool.

### 2. Non-entrants get a prediction hook

Spectators and rally-arrivals get **picks**: choose who survives a round, locked until the round closes, scored into a public **taste score**. This is vote-to-unlock's structure — a result of your own, held hostage until the round resolves — for people who never submit anything.

Taste score unlocks real things, per the tiers-with-teeth principle: early access to drops, greater weight in the quality pool, and eventually the ability to judge a brand campaign. Weighting votes by demonstrated taste also improves the quality signal, so the retention mechanic and the integrity mechanic are the same mechanic.

### 3. Prize economics rebalanced

| Component | Formula | At a $5,000 pool |
|---|---|---|
| Winner prize | the pool | $5,000 |
| Finalist stipends | 12% of pool, 4 ways | $150 each |
| **Round-2 survivor bonus** (new) | 6% of pool, split across survivors | $25 each |
| **Crowd favourite** | **5% of pool, floor $50**, paid from platform fee | $250 |
| Platform fee | 20% of (pool + stipends + survivor bonus) | $1,180 |

Net take after the crowd-favourite bonus and Stripe processing is **a stable 10.2% of brand spend at every pool size from $900 to $10,000**, and never negative. The headline "20% take rate" in ADR-002 is gross; 10% is the number the business actually runs on, and internal models should use it.

The survivor bonus exists to fix a retention problem, not a fairness one. Previously 5 of 32 entrants were paid (16%); now 13 of 32 are (41%), which moves the probability that a creator has been paid *something* after two campaigns from 29% to 65%. Since §5 makes "one payout event in month one" the D30 mechanism, that shift is the difference between the target being reachable and being arithmetic fiction.

### 4. Vote-gate hardening

Picking is disabled for the first 3 seconds of playback, and one pair in each deck is a repeat of an earlier pair — an attention check. Inconsistent answers discard the deck. Speed-tapping through eight pairs to unlock a result was previously free, and it polluted the exact signal that decides round 1.

### 5. Streaks pause on supply failure

If no eligible deck exists in a user's market, the streak **pauses** rather than breaks, and says so. A streak broken by the platform's own thin marketplace is worse than no streak — and in a one-city, ten-brand launch, dry days are certain. This is explicitly not a purchasable freeze; §4 rules out paywalled streak protection.

## Data model changes

- `RallyAttribution(voter_id, creator_id, campaign_id, created_at)` — the edge above, never expires
- `Vote` gains `pool` (`quality` | `rally`) so the two currencies are separable at query time
- `Prediction(user_id, round_id, submission_id, locked_at, correct)` and a derived `taste_score`
- `Payout.type` expands to include `survivor_bonus` and `crowd_favourite`
- `Deck(user_id, round_id, pairs[], check_pair_index, completed_at, discarded)` — needed for the attention check and for vote-deck completion rate, the metric §9 calls the leading indicator

## Consequences

- Quality-pool assignment becomes a real query with an exclusion join, run per campaign rather than per user. It needs an index on `RallyAttribution(creator_id)` and should be computed at round open, not at vote time.
- Two payout types are added, which means more Stripe transfers per campaign — batch them at round close rather than firing individually.
- The crowd favourite is now a platform cost that scales with pool size. It should appear as a line in unit economics, not be buried in the fee.
- Prediction introduces a second scoring system to explain in onboarding. The product now has quality score, rally score, and taste score, and the copy has to keep them distinct or the two-currency clarity is lost.
- Weighting quality votes by taste score is a ranking change with real consequences for who wins. It should ship behind a flag and be measured before it's trusted.

## Action items

1. [ ] Build `RallyAttribution` with per-creator scoped exclusion at quality-pool assignment
2. [ ] Add `pool` to `Vote`; separate quality and rally tallies everywhere
3. [ ] Build predictions, taste score, and the locked-until-close reveal
4. [ ] Reprice crowd favourite to 5% floor $50, paid from platform fee
5. [ ] Add the round-2 survivor bonus payout type
6. [ ] Add minimum view duration and repeat-pair attention checks to the deck
7. [ ] Make streaks supply-aware, with an explicit paused state
8. [ ] Correct internal models to a 10% net take rate rather than 20% gross
9. [ ] Decide the fallback when one creator's attribution edges exceed 15% of active voters
