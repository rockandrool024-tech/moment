# PERIOKIO — Complete Execution Prompt (Reviewed)

**Version:** 2.1 — reviewed against the actual repository, 21 August 2026
**Status:** Corrected. v2.0 (pasted into chat, not previously in this repo) contained three items that
either contradicted locked decisions or restated already-shipped work as if it were new. See
**§0 Review notes** before treating any section below as an instruction.

---

## §0. Review notes — read this before executing anything

This revision exists because v2.0 was audited against the actual codebase (not against a mockup or
an earlier draft of the product) and three real problems turned up. Per this document's own rule —
*"When a decision requires product approval, stop and ask clearly"* — none of the three were silently
fixed by picking an answer. They're marked **OPEN DECISION** below, at the section they belong to.

**1. §3 (Mapbox shared user locations) reverses a locked decision.** The live map has never used real
GPS or a real coordinate — every pin position is a deterministic hash of the entity's id, and the
project's own docs restate this repeatedly, including a line in `README.md` written the same week as
this prompt: *"no GPS/geolocation permission flow exists anywhere in the app."* v2.0 asked for
backend-served, opt-in, approximate real locations (city centroid / geohash) — a reasonable pattern on
its own, but a reversal of that stance, not an extension of it. Rewritten below as an open decision
requiring a real ADR before any implementation, not a build instruction.

**2. §7 (unit economics) used numbers that don't match the locked ADR-005 table**, and introduced two
brand-new monetization mechanics — a pay-for-visibility "Boost" and a 10% platform fee on creator
payouts over $1,000 — that don't exist anywhere in this project's history. The payout fee in particular
sits close to "purchasable advantage near the prize," the exact category `README.md`'s "Explicitly
rejected" section already killed once, just approached from the platform side instead of a buyer's.
Corrected the table to match ADR-005 and moved the new mechanics to an explicit open decision.

**3. §2.7's k-factor claim is more optimistic than its own source.** `docs/growth-viral-mechanics.md` —
which §2 otherwise restates closely — concludes 1M users in 30 days is *"achievable only as a launch
spike... it will not hold,"* and explicitly recommends planning against k≈0.9, not k>1.4 sustained.
v2.0 dropped that caveat. Restored below.

**What's already built** (so this prompt doesn't cause rediscovery work): the Character Creator (§4,
presets + palette, real persistence, cosmetic-only — shipped), cosmetic crypto coins via Coinbase
Commerce (§6's own recommended shape — shipped), the rally loop / two-currency split / vote-to-unlock /
knockout cards / survivor bonus (§2 — shipped per ADR-003/005), and the growth dashboard (§9 — shipped,
with D1/D7/D30 honestly returning "needs a cohort table" rather than fabricated numbers). Genuinely
unbuilt: secure avatar file-upload (§4), Arabic/French + RTL (§10, confirmed — no i18n package exists
in `apps/web` today), and vote-fraud anti-abuse tooling beyond the existing stub (§5 — was cut once
already, see note there).

---

## Overview

You are working directly on the **Periokio/Moment** application in the existing GitHub repository. Work in normal execution mode and improve the real product—not a static mockup. Preserve the existing architecture, backend contracts and working user flows unless a change is necessary and documented.

The approved brand direction is:

- **Master slogan:** Where stories become opportunities.
- **Primary creator CTA:** Start your story.
- **Product ambition:** Build a viral, engaging, financially meaningful Story Economy and Creator Growth Network for MENA.

*(Already live: the current landing page copy already carries this slogan and CTA verbatim — this isn't a pending change.)*

**Core product insight:** This is not a content app with a payout feature. It is **a payout event that generates content, spectators, and its own marketing** — and the fastest path to growth is to stop optimising the share button and start optimising the two hours before a round closes, when creators are begging their followers to come to the app.

---

## Mission

Enhance the complete Periokio application so that it functions as a **viral growth engine** with:

- **Addictive retention mechanics** that bring users back daily
- **Fair competition** where quality wins, not follower count
- **Clear financial incentives** that reward creators at every level
- **Shareable moments** that turn users into marketers
- **MENA-first localization** with Arabic, English, and French support

---

## Required Working Process

First audit the current repository, routes, types, API contracts, Prisma schema, existing UI system, Mapbox implementation, avatar generator, file upload paths, wallet implementation and deployment configuration. Reuse existing contracts wherever possible.

For every functionality that is missing, ambiguous or could be implemented in more than one reasonable way, present at least three solution options before choosing one. For each option, explain the user experience, backend impact, privacy or compliance implications, implementation cost, risk and recommendation. Do not silently invent fields or pretend that a frontend-only interaction is connected to production data.

When a decision requires product approval, stop and ask clearly. When the decision is low-risk and reversible, choose the safest implementation, document the choice and continue.

---

## 1. Responsive UI/UX System

Improve the design system and all key screens so the interface adapts cleanly to:

- Small mobile phones from approximately 320px width
- Modern mobile devices from 375px to 430px
- Tablets in portrait and landscape
- Laptops from 1024px upward
- Large desktops and wide external monitors

Use responsive grids, fluid type, safe areas, accessible touch targets, keyboard navigation, proper focus states, readable contrast, reduced-motion support and no horizontal overflow. Ensure fixed navigation, sheets, modals, upload areas, video cards, wallet panels, map controls and share cards behave correctly at every breakpoint.

Use content-aware layouts instead of simply scaling desktop down to mobile. Validate loading, empty, error, success, permission-denied, unauthenticated and slow-network states. Verify Arabic RTL layout as well as English and French where the language switcher is present.

*(Partial credit already exists: a shared `--bottom-nav-clearance` token fixes fixed-position sheets/feeds colliding with the mobile bottom nav; a mobile-first pass already caught and fixed that class of bug once. RTL itself is unbuilt — see §10.)*

---

## 2. The Viral Growth Engine

The share card is not the growth engine. It's an amplifier with a weak multiplier. The actual engine is:

> **A creator competing for $5,000 will market the app harder than the platform ever will — because they're marketing themselves.**

Every creator who reaches round 2 has a direct, urgent, personal financial reason to send their existing audience to the app *this week*. That is unpaid distribution with an 8–12% click-through rate, because it isn't an ad — it's a friend asking for a favour.

### 2.1 The Rally Loop — already shipped

**Mechanism:** Every creator who submits a story receives a personal rally link (`periokio.com/v/username`) with attribution tracking.

**Implementation:**
- Dashboard shows: "Your rally link has driven 47 votes. You're in 3rd place."
- Pre-built rally assets: countdown story sticker, "2 hours left" card, caption templates
- "Your voters" counter — visible, climbing, addictive
- Rally XP for votes arriving through the link

**Expected impact:**
- Share cards alone: k ≈ 0.47
- Rally links: k ≈ 0.5-0.9

### 2.2 The Two-Currency Split (Integrity Mechanism) — already shipped (ADR-005)

If bringing your own audience wins the money, this is a follower-count contest, not a creative contest. The best creator with 400 followers loses to a mediocre one with 40,000. Creator supply dies.

**Resolution — split the signal into two currencies:**

| Currency | What it measures | What it decides |
|----------|------------------|-----------------|
| **Quality score** | Blind votes from a randomly assigned verified pool who did not arrive via a creator link | Who wins the prize |
| **Rally score** | Votes from your own attributed link, hard-capped | XP, tier progress, a separate cash bonus |

**Rallying earns status and a bonus, never the prize.** The creator still has every reason to market hard, the contest stays honest, and the platform can say so publicly: *"Your followers can't buy you the win here."*

**Crowd favourite bonus:** 5% of the pool, minimum $50, paid from the platform fee. Two winners per campaign, two share moments, zero corruption of the main vote.

**Scoped exclusion:** A voter recruited by `@username` can never cast quality votes in campaigns where `@username` competes, and is a valid quality voter everywhere else immediately.

### 2.3 Vote-to-Unlock (Retention Hack) — already shipped

**Mechanism:** After submitting a story, the creator must vote on 8 other submissions before seeing their own score.

**Implementation:**
- Picking is disabled for the first 3 seconds of playback
- One pair per deck repeats an earlier pair as an attention check
- Result is *hostage* until voting is complete

**Targets:** D1 45% · D7 28% · D30 15%.

**For non-entrants:** Predictions — pick who survives, locked until the round closes, scored into a public taste score that unlocks early access and greater weight in the quality pool. *(Schema exists — `Prediction` table — but nothing reads or writes it yet; this remains a real, unbuilt Sprint-5 item, not shipped.)*

### 2.4 Knockout Cards — already shipped

**Mechanism:** Every eliminated creator receives a shareable card.

**Example:** *"I got eliminated in round 2 of the $5,000 Fisherman's Story Challenge. Go watch the person who beat me."*

**Implementation:**
- Auto-generate a roast-tone elimination card
- Tag the winner, tag the story, tag Periokio
- Losing publicly with humour is more shareable than winning

**Expected impact:** 20 losers per campaign vs 1 winner = 20× larger share surface.

### 2.5 Survivor Bonus — already shipped

**Mechanism:** Everyone who reaches round 2 receives a small cash bonus.

**Implementation:** 6% of pool, split across round 2 survivors (~$25 each at a $5,000 pool).

| Metric | Old | With survivor bonus |
|--------|-----|---------------------|
| Paid per campaign | 5 of 32 (16%) | 13 of 32 (41%) |
| P(paid) after 2 entries | 29% | 65% |
| P(paid) after 3 entries | 40% | 79% |

### 2.6 The Visible Clock

**Mechanism:** The dollar number is the biggest text on every screen. A live countdown under it.

**Implementation:**
- Homepage: **"$5,000"** in large tabular-numeral type
- Under it: a live countdown to round close
- Every screen shows the clock
- When time runs out, the round closes. No extensions. No mercy.

**Why this works:** Urgency is the difference between a feed and an event. FOMO drives action.

*(Not fully audited for "biggest text on every screen" — worth a pass, but this is copy/layout emphasis, not new backend work.)*

### 2.7 The Five Loops Stacked — corrected to match the source model

| # | Loop | Trigger | k contribution | Cycle |
|---|------|---------|----------------|-------|
| 1 | **Rally** | Round opens, deadline visible | high, alone doesn't reach 1.4 | 2-3 days |
| 2 | **Result card** (win + knockout) | Advance / win / knockout | 0.4-0.5 | 1 day |
| 3 | **Referral** | Post-win, post-payout | 0.2-0.3 | 7+ days |
| 4 | **Spectator → Creator** | Watched 3 finals, saw the money | 0.15 | 5-10 days |
| 5 | **Brand → Audience** | Brand posts winner to its channels | 0.1 | per campaign |

**Corrected conclusion, matching `docs/growth-viral-mechanics.md`'s own honest-math section:** combined,
these loops plausibly clear **k ≈ 0.9** in steady state — not a sustained 1.4-2.5. A sustained k above
1.4 is achievable only as a **launch spike** (invite scarcity + a paid seed + one culturally-loud
campaign), and spikes of that shape decay hard within 90 days (see Clubhouse, Wordle). Plan against
k≈0.9 and D30≥15%; treat anything above that as upside, not the target. **Hard rule stands: no paid
acquisition before k≥0.6 (day 36 gate in §8).**

---

## 3. Mapbox Experience and Shared User Locations — OPEN DECISION, blocked pending a real ADR

**This section is not an instruction to implement.** It asks for backend-served, shared, approximate-
but-real public user locations. That's a genuine, defensible product pattern in isolation — but it
directly reverses the app's current, repeatedly-documented stance that map pin positions are a
deterministic hash of each user's id, never a real coordinate, with no location-permission flow
anywhere in the app. Reopening that needs the same treatment `docs/ADR-006` already gave one prior v2
proposal that hit a locked decision: a real ADR that names the conflict and argues past it explicitly,
not an implementation that quietly changes the meaning of every pin on the map.

If and when this gets a green light, the three options below are the right shape to decide between —
preserved from the original ask:

- **Privacy-first city/place pins** — lowest privacy risk, coarsest social utility (matches a
  "12 challenges near you" framing without ever placing an individual).
- **User-controlled approximate location with geohash clustering** — the middle path: real opt-in
  per-user location, deliberately blurred, clustered at low zoom. Most implementation cost (consent
  flow, storage, migration, clustering logic, moderation surface).
- **Private location for personal map centering plus a separate public profile location** — splits
  "where the map centers for you" from "what other people can see," which is the safest version of
  "real" location if this direction is chosen at all.

Until a decision is made, the existing stylized approach — deterministic hash positions, no real
coordinate, no permission flow, restated explicitly in the app's own UI copy ("laid out for feel, not
GPS") — remains the default and should not be quietly changed by an unrelated feature PR.

Recommend the safest approach for MENA and explain the trade-off between social utility and privacy
*only after* this is explicitly greenlit.

**Everything else in this section is still good guidance for whatever direction gets chosen:** distinct
visual language for profiles/creators/challenges/live events/clusters, clustering at low zoom,
a restrained reduced-motion-respecting reveal animation that stops on interaction, a profile
bottom-sheet on tap, and graceful behavior when location is denied/unavailable.

---

## 4. Profile, Avatar Creator and File Import

**Character Creator — already shipped.** Presets (Parrot / Street signal / Studio light / Night mode) ×
palette (Tropical / Coral pulse / Midnight / Warm sand), real backend persistence
(`User.characterPreset`/`characterPalette`/`characterUpdatedAt`), and the UI states this document asks
for (preview, selected, save) already exist. The page's own copy already says the cosmetic-only line
this document asks for: *"Character choices change your visual presence only. They never affect
voting, ranking, payouts or verification."* Nothing to do here except keep it in mind while building
the piece below.

**Secure file-import for profile pictures — genuinely unbuilt.** Today's avatar system is a
deterministic generated placeholder (`GET /users/:id/avatar.png`), not a real upload path. Everything
this document asks for — accepted-types/size-limit disclosure, client preview, validation, upload
progress/cancel/retry, server-side content-type checks, no path traversal, no unsafe SVG execution, no
unbounded file size, consent + delete/revert — needs building from scratch. Compare the three strategies
listed in the original ask (presets-only / upload-plus-character / hybrid) before starting; given the
Character Creator already exists and works, "hybrid" (photo + character identity + optional brand
assets) is likely the strongest fit with what's already shipped, but this is exactly the kind of call
this document's own process says to bring options for, not decide silently.

---

## 5. Reputation, Ratings and Gamification

Make ratings and reputation central to personal branding, but keep them fair and explainable.

Design a reputation system that distinguishes clearly between:

- **Blind creative quality score** — from the two-currency split *(shipped)*
- **Community support or rally momentum** — from rally votes *(shipped, as rally XP)*
- **Verified completion and reliability** — from finishing challenges
- **Brand or client feedback** — from paid campaigns *(shipped — bidirectional `Rating`, ADR-004)*
- **Participation streaks or progress** — from consistent activity *(shipped — voting streaks, pause not
  break)*
- **Public profile reputation** — the composite view

Do not combine these into one unexplained score. Show the dimensions separately and document how each is earned. Do not allow followers or money to directly purchase a quality score.

**Anti-abuse note:** coordinated-vote-fraud detection was already scoped once and explicitly **cut, not
stubbed** — the existing project docs give the reason: *"needs real voting data to tune thresholds — a
fake version would be actively misleading."* Device attestation / velocity caps / audit logs / appeal
states are reasonable, but re-scope this against that same constraint rather than assuming a clean
slate — a fabricated fraud-detection system that hasn't been tuned against real data is arguably worse
than none, for the same reason it was cut before.

Use gamification that creates healthy reasons to return:

- Story progress
- Creator milestones
- Weekly opportunities
- Cohort progression
- Skill and reliability badges
- Reveal moments
- Personal growth analytics
- Shareable proof of achievement

**Tiers with real teeth — confirmed real gap, independently flagged before this document existed.**
Bronze → Silver → Gold → Platinum currently render as a badge only; nothing is functionally gated by
tier. Needs: higher-pool challenge eligibility, earlier access, lower AI-credit cost, or similar —
actual mechanics, not just color.

**Streaks on voting, not posting** — already the shipped design (pause-not-break, per ADR-005 §5).

---

## 6. Crypto and Payment Options — already shipped, matches the recommendation below

Cosmetic coins via Coinbase Commerce already exist, built exactly to this section's own "Recommendation
for the first release": real money (prizes, stipends, payouts) stays fiat via Stripe; crypto is scoped
to cosmetic coins only; the coin balance is structurally separate from `Payout` and never read by any
scoring/vote/entry/payout code path; crypto ownership is never required to compete or spectate.

Investigate how to add crypto payments without compromising user safety, compliance or trust. Do not implement crypto payment flows until the options have been compared.

Present at least three current options, such as:

1. A hosted crypto checkout provider for cosmetic coins or non-prize purchases *(chosen — Coinbase Commerce)*
2. Stablecoin payment rails for approved brand or creator payouts through a regulated provider
3. Fiat-first payments with optional crypto conversion handled by a licensed partner
4. A non-custodial wallet connection for optional cosmetic or community features, if legally and technically appropriate

For each option, assess: supported countries/currencies, custody, KYC/AML and sanctions responsibilities, chargebacks/refunds, tax/prize/gambling/consumer-protection risk, provider fees and settlement time, webhook reliability and reconciliation, and whether crypto is appropriate for prizes, creator payouts, brand funding or cosmetic coins.

Options 2-4 remain unbuilt and would each need their own real evaluation before touching prize/payout
money — nothing here proposes doing that.

---

## 7. Unit Economics — corrected to match the locked ADR-005 table

The "20% take rate" is gross. After the crowd-favourite bonus and Stripe processing, net take is
**10.2%** of brand spend, stable across pool sizes (this is the locked table in `README.md`, not a
new calculation):

| Pool | Brand pays | Gross fee | Crowd fav | Net to platform | Real take |
|---|---|---|---|---|---|
| $900 | $1,274 | $212 | $50 | $125 | 9.8% |
| $2,000 | $2,832 | $472 | $100 | $290 | 10.2% |
| $5,000 | $7,080 | $1,180 | $250 | $724 | 10.2% |
| $10,000 | $14,160 | $2,360 | $500 | $1,449 | 10.2% |

*(v2.0's version of this table used different numbers — $475 net / 6.7% real take at a $5,000 pool —
and didn't match the locked figures anywhere else in this codebase. Use the table above.)*

**OPEN DECISION — none of the below are approved, all four need the three-options-plus-recommendation
treatment before any of them touch code:**

- A "Boost" pay-for-visibility feature ($50/creator)
- Brand sponsorship packages ($25,000/campaign)
- Raising the take rate to 30%+ for premium challenges
- **A platform fee on creator payouts over $1,000** — flagged specifically: this is a fee taken out of
  a creator's *prize* money, which sits close to "purchasable advantage near the prize," the category
  `README.md` already rejected once from the buyer's side. Taking a cut of the same money from the
  platform's side deserves the same scrutiny, not less.

**Measure:** Brand repeat rate. If <40%, fix the brand side before scaling — this part of the guidance
is sound regardless of which monetization idea (if any) gets approved.

---

## 8. The 90-Day Launch Plan

Virality is multiplication, and multiplication needs something non-zero to work on.

### Phase 1: Seed (Days 1-14)

- **One city, one lane** — Pick a single city (Tunis is a real advantage — dense, under-served, low CAC, high creator density per dollar) and a single vertical (food and beverage). Do not launch nationally.
- **Seed the brand side by hand** — 10 local businesses. Subsidise the first pool if necessary.
- **Recruit 50 creators personally** — Not 5,000. Fifty, by DM, who will actually enter.
- **Success gate:** ≥40 entries on campaign #1

### Phase 2: Loop (Days 15-35)

- Rally links, knockout cards, personal vote pages live *(already true today)*
- Vote-to-unlock live *(already true today)*
- Survivor bonus live *(already true today)*
- Predictions for non-creators live *(not yet — real Sprint-5 item, see §2.3)*
- **Success gate:** k ≥ 0.6, D7 ≥ 25%

### Phase 3: Spike (Days 36-50)

- $10,000 flagship campaign
- Invite scarcity (only 32 spots, first come first serve)
- Press campaign around the winner
- **Success gate:** 100k signups in 14 days

### Phase 4: Expand (Days 51-75)

- Open second city using geo-map coverage gaps
- Add functional tiers (Bronze → Platinum) — *see §5, this is the real-teeth gap*
- **Success gate:** k ≥ 0.9, brand repeat rate ≥ 40%

### Phase 5: Scale (Days 76-90)

- Paid top-up on top of a proven loop
- **Success gate:** 1M cumulative users, D30 ≥ 15%

**Hard rule:** no paid acquisition before day 36. Paid on top of a broken loop is a machine for converting money into uninstalls. The day-35 gate is real — if k < 0.6, fix the loop, don't buy users.

---

## 9. The Dashboard — 8 Numbers, Nothing Else

Already shipped as the admin growth dashboard, with one honest gap: D1/D7/D30 explicitly returns
"needs a cohort table" rather than a fabricated number, since no cohort table exists yet.

1. **k** (signups attributable to existing users / active users), rolling 7d
2. **Cycle time** (invite sent → invitee's first action)
3. **D1 / D7 / D30** *(blocked on a cohort table, honestly reported as such)*
4. **Vote-deck completion rate** — the leading indicator for everything
5. **Entries per campaign** — marketplace liquidity; below 20 the format stops working
6. **Brand repeat rate** — the only real proof of product-market fit on the paying side
7. **Time to first payout** per creator cohort
8. **Flagged-vote rate** — integrity early warning

If only two: **vote-deck completion** (retention + integrity + engagement in one number) and **brand repeat rate** (revenue).

---

## 10. MENA Localization and Positioning — confirmed unbuilt

No i18n package exists in `apps/web` today, and no RTL handling exists anywhere in the codebase — this
is real, from-scratch work, not a config flag. The landing page's English copy already carries the
approved slogan and CTA, which is a head start on content, not on infrastructure.

Keep the approved master language:

- **Where stories become opportunities.**
- **Start your story.**

Add a language switcher for Arabic, English and French with proper RTL support. Localize not only navigation labels but also brief wording, rights, payments, trust, moderation and help content. Do not use literal machine translation for high-stakes financial or legal language.

Use Saudi Arabia and the UAE as the first premium and creator-event markets, and Egypt as a scale and creator-supply market. Treat Morocco and wider North Africa as a validation market before broad paid acquisition.

**Local as identity:** "12 challenges near you" and a city leaderboard. Gen-Z virality is geographic before it's global — it moves campus by campus, city by city. *(Note: the geo-map half of this depends on §3's open decision — a stylized, non-real map can still support a "near you" framing city-by-city without resolving the real-location question, if that's the path chosen.)*

---

## 11. Risks and Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| **Legal — sweepstakes / gambling** | Existential | Get an opinion *now*, before ToS is written. Entry must be free, outcome must be skill-determined, and the peer-vote mechanic needs to be defensible as skill. Jurisdiction by jurisdiction. *(Already the standing launch blocker in this repo — not new.)* |
| **Loser churn** | High | Survivor bonus + knockout cards. Already shipped. |
| **Brand side is the bottleneck** | High | Creators are free and infinite. Funded brands are neither. Consider a lower take rate (12%) for local in-place challenges to buy supply. |
| **Rally corrupts the vote** | High | Two-currency split. Already shipped — do not ship anything that reopens it without re-deriving this protection. |
| **Vote fraud at scale** | Medium | See §5's anti-abuse note — this was cut once for lacking real data to tune against; re-scope with that in mind. |
| **First-mover imitation** | Medium | The moat is not the mechanic, it's the trust ledger — Stripe-verified payout history a competitor cannot fabricate on day one. |
| **Supply failure** | Medium | Pause streaks when there are no eligible decks. Already shipped (pause, not break). |

---

## 12. Required Deliverables

At the end of the work, provide:

1. A summary of what was already present and what was changed *(this document's §0 is that summary for everything covered so far)*
2. Three solution options and one recommendation for every significant new functionality
3. Updated UI/UX system and responsive behavior
4. Updated Mapbox experience with documented privacy model *(blocked on §3's open decision)*
5. Profile, Character Creator *(done)* and secure file-import implementation *(not done)*
6. Payment and crypto option comparison with an explicit recommendation *(done — see §6)*
7. Reputation and gamification model with anti-abuse rules
8. Backend schema, DTOs, endpoints, migrations and tests for any new persistence
9. Accessibility, RTL and reduced-motion validation
10. Production build, test results, deployment notes and GitHub commit
11. **k-factor measurement** integrated into analytics
12. **Brand repeat rate** tracking
13. **Vote-deck completion rate** monitoring
14. **D1/D7/D30** retention dashboard *(blocked on a cohort table)*

---

## 13. What to Leave Out

- Streak-freeze paywalls
- Loot boxes
- Anything resembling gambling near real money
- Cosmetic-only tiers (tiers must unlock real benefits) — *see §5, confirmed real gap*
- Features that only work with mock data — *matches this project's existing "stub honestly, don't fake" rule already applied everywhere else in the codebase*
- **Added by this revision:** real user GPS/geolocation, and a platform fee on creator prize payouts — until each gets its own explicit sign-off per §3 and §7

---

## One-Line Summary

**Periokio is a payout event that generates content, spectators, and its own marketing.** Most of the
mechanism this document describes is already built. The fastest path forward is finishing the three
genuinely unbuilt pieces (avatar upload, MENA localization, tier teeth) and getting explicit answers on
the three open decisions (real map locations, new monetization mechanics, the k-factor target) — not
re-deriving what already exists.
