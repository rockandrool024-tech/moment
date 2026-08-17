# ADR-006: Story economy mental model, storyteller ownership, and what an external "v2" proposal does and doesn't change

**Status:** Proposed
**Date:** 2026-08-11
**Deciders:** Founder (rockandrool024)
**Affects:** `Story`/`StoryClaim`/`Content`/`ExternalPost` (added post-ADR-005, see README's Perokio-rebrand entry), `docs/prompt-v2-journey-and-3d-map.md` (backlog, unaffected), ADR-003 (round format), README's "Explicitly rejected" section

## Context

A third-party document (`PEROKIO-CORE.txt`, not authored by this team, not previously reviewed against the codebase) proposed reframing Perokio from "a marketplace with stories attached" to a "story economy and creator growth network," with twenty numbered recommendations spanning the data model, scoring, growth loops, and roadmap sequencing.

Some of it describes what's already built. Some of it is a genuine, adoptable improvement nothing here does yet. Two pieces of it directly contradict decisions this project's own README already locked and gave documented reasons for rejecting. Per this repo's own rule — "scope is frozen, changes require a new ADR, not an edit to an existing one" — none of the twenty recommendations get adopted by just reading the file. This ADR is that review, item by item, so engineering doesn't accidentally build toward a "Story Marketplace" that has to be unwound later, and doesn't accidentally reopen a rejected decision either.

## Decision

**Adopt the mental-model reframe, with the existing architecture underneath it unchanged.** Perokio is a story economy and creator growth network in which brand-funded challenges are one high-stakes mode, not the conceptual center. This matches what the Story/StoryClaim/Content/ExternalPost model already does — `Challenge` was never made to disappear, it became `Story.mode = CHALLENGE`.

**Already true — no work required:**

| Proposal item | Status |
|---|---|
| #2 — split rigid `StoryType` into independent axes | Done. `StoryAccess {FREE, PAID}` × `StoryMode {OPEN, CHALLENGE}` on `Story`, not a locked enum. |
| #4 — Content as the performance entity, not a bare claim | Done, in simpler form. `Story → StoryClaim → Content → ExternalPost[]`. One `ExternalPost` table with a `platform` string, not five per-platform tables — no evidence yet that five tables buy anything a filter doesn't. |
| #5 — don't let raw views become the market score | Already stricter than asked. `ExternalPost.views`/`.likes` are creator-entered, display-only; no scoring/tally/payout path reads them (see the table's own code comment). |
| #12 — don't promise automated cross-platform publishing yet | Already the built behavior — creator pastes a URL, nothing is verified against a platform API. |

**Adopted now, real work, scoped down from the proposal:**

1. **Storyteller ownership surface** (proposal #3). A seller who posted a Story can see it from the seller's own side: how many creators claimed it, how many produced content, and their creator-reported (not verified) posts and engagement numbers rolled up. This uses only existing relations (`Story.sellerId` → `StoryClaim[]` → `Content` → `ExternalPost[]`) — **no new tables or columns.** The proposal's mockup numbers ("Views: 128K," "Followers gained: 842," "Earnings: $250") are not implemented as shown: views are a sum of creator-entered numbers labeled as such, and followers-gained/earnings are omitted entirely because no real data source exists for either yet (see Action items).
2. **Story lifecycle as a derived stepper**, not stored state: Submitted (always true) → Claimed (has a `StoryClaim`) → Content added (claim has `Content`) → Posted (`Content` has an `ExternalPost`). Computed from existing rows on read. This is the proposal's #9 "Task Bar" idea scoped down to what's honest to ship today — a status readout, not a cross-story workflow/notification engine, which is a materially bigger build (queueing, per-user task aggregation, a "3 things need you" homepage surface) that hasn't been scoped or estimated.

**Adopted in principle, blocked on a real prerequisite that doesn't exist yet:**

- **Structured licensing** (proposal #11). Genuinely needed once a `PAID` Story exists, and genuinely missing — but no `PAID` Story can be created by any path today. `CreateStoryDto` deliberately excludes `access`/`mode`; every client-created Story is `FREE`/`OPEN`. Building a licensing schema for a story type nobody can create yet is building for a hypothetical. This ADR records the requirement (usage scope + exclusivity, at minimum) as a blocker on shipping `PAID` story creation, not as schema to add today.
- **Storyteller earnings** (part of proposal #3's dashboard). There is no payout mechanism for a storyteller today — `Payout` rows are creator-facing (winner/stipend/survivor-bonus/crowd-favourite/referral-bonus), and nothing pays a seller for a `PAID` Story being claimed or completed. This is a real design decision (does the storyteller get paid on posting, on claim, on a schedule?) that needs its own scoping, not a number invented for a dashboard.

**Explicitly not adopted — conflicts with a locked, reasoned decision:**

1. **Market/reach-based performance feeding a creator's persistent score or rewards** (proposal #5's "Market Efficiency," the executive summary's "measures... real-world market performance... to build a persistent creator performance record"). README's "Explicitly rejected" section already killed CPM/view-based payouts, with a specific reason: *"Reach would convert directly to cash, which reverses the two-currency split and makes the on-screen promise that followers can't buy the win false."* A performance record that a creator's score visibly tracks is close enough to that same failure mode — a creator with a bought or borrowed audience outperforms a creator with better content, on a metric the platform vouches for. If this is worth reopening, it needs its own ADR that confronts that specific objection directly, not an implicit adoption via a mental-model doc.
2. **Round 3 as non-eliminating "Momentum"** (proposal #6). ADR-003 locked the public final as blind verified-audience vote plus a brand pick among the surviving finalists — an elimination round, by design, because stakes are what create "events" (the same value proposal #17 argues for keeping). Removing elimination from round 3 changes the prize/stipend math in ADR-005 (finalist stipends, crowd favourite) and the "13 of 32 entrants get paid" framing the README leads with. Not adopted; flagged as an open question if the team wants to explore it deliberately.

**Deferred, not rejected, just unscoped:** the Task Bar as a real workflow engine (#9, see above), a configurable per-mode scoring-weight table (#7), the four distinct link types — story/creator/rally/storyteller (#15, currently only rally + referral links exist), and the dual Score+Tier system (#16 — `User.perokioScore` is a real nullable column per the Perokio-rebrand work; nothing computes it).

## Trade-offs

**Scoping down the dashboard loses the emotional punch of the proposal's mockup.** "128K views, 842 followers gained, $250 earned" reads better than "3 creators claimed this, 2 posted content." That's the cost of not fabricating numbers with no underlying data source — the alternative is a dashboard that lies to a storyteller about their own story's performance, which is worse for trust than a duller, honest one.

**Rejecting the market-score item isn't free either.** The proposal's underlying observation — a creator with 10K followers generating 500K views produced a real, meaningful signal — is correct. The objection isn't that the signal is meaningless, it's that *feeding it into score/reward* reopens the CPM rejection. Showing the same numbers as unscored, informational context (which the existing `ExternalPost` display-only fields already do) captures the signal without the failure mode.

## Consequences

- No schema migration ships with this ADR. The storyteller dashboard and lifecycle stepper are read-model additions on top of existing tables.
- `PAID` Story creation remains unbuilt; licensing design is now a documented, explicit blocker on that work rather than a silent gap.
- The market-score and non-eliminating-round-3 questions are now visible open items instead of ideas absorbed by osmosis from an unreviewed file. Either can be pursued, but each needs its own ADR that argues against the specific, documented reason it was rejected the first time.

## Action items

1. [x] `GET /stories/me/mine` — a seller's own Stories with claim/content/engagement rollup (this ADR)
2. [x] Story lifecycle stepper on the storyteller dashboard view (this ADR)
3. [ ] Design storyteller payout mechanics before `PAID` Story creation ships (blocked, unscoped)
4. [ ] Design structured licensing fields before `PAID` Story creation ships (blocked, unscoped)
5. [ ] Decide, explicitly, whether to pursue market/reach-informed scoring — requires confronting the CPM-rejection reasoning head-on
6. [ ] Decide, explicitly, whether to pursue a non-eliminating round 3 — requires reworking ADR-005's stipend/crowd-favourite math
