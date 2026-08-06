# ADR-003: Teaser stage and peer-vote elimination

**Status:** Proposed
**Date:** 2026-08-03
**Deciders:** Founder (mortadha)
**Supersedes:** the round-1 description in ADR-001 (checklist + seller manual cut is now one signal among several, not the sole gate)

## Context

The original elimination design (ADR-001) had round 1 be a checklist filter plus a seller manual pick, and round 2+ be a blind public/verified-audience vote. It worked, but it missed the most gamified, "talent show" part of the concept: creators judging creators. The founder wants round 1 to run on teasers (not full content) with elimination decided primarily by creators voting blind on each other's teasers, survivors then create full content in round 2, and the funnel narrows through peer voting before handing off to the public audience vote for the final call — preserving the spectator/virality mechanic from ADR-002 at the moment it matters most.

The obvious risk with peer voting is sabotage: a creator is directly incentivized to tank a strong rival's score. Two guardrails were chosen to address this: reuse the existing blind pairwise vote UI (relative comparison is harder to game than an absolute rating), and gate a creator's own results behind casting a minimum number of peer votes first (forces genuine participation, discourages drive-by voting with no real engagement).

## Decision

Restructure the competition funnel into three stages instead of two:

**Stage 1 — Teaser (round 1).** Creators submit a short teaser (e.g. ≤15s) instead of full content. Checklist auto-filters obvious rule-breaks. Every remaining creator must cast blind pairwise votes on a minimum number of peer teasers (e.g. 8) before their own advancement result is revealed — this is the participation gate. The seller also gives each teaser a quick score (1-5, lightweight — not the old full manual review). A creator's round-1 rank combines their peer-vote win rate with the seller's score (peer vote weighted primary, e.g. 70/30, tunable per campaign). Top N advance.

**Stage 2 — Full content (round 2).** Survivors create the complete submission. Remaining creators again peer-vote blind pairwise on each other's full content, narrowing the field to a final 2-3.

**Stage 3 — Public final (round 3).** The narrowed finalists go to the existing blind public/verified-audience vote (ADR-002's spectator mode and sharing loop apply here), with the seller making the final call between the top results — this is where the original ADR-001 mechanic still lives, now scoped to just the final decision rather than the whole competition.

## Data model changes

`Submission` gains a `phase` field (`teaser` | `full_content`) so the same creator's two uploads for one challenge are tracked as linked records, not separate entries. `Round.type` expands to `peer_vote_teaser`, `peer_vote_narrow`, and `public_vote_final` (replacing the old generic `seller_cut` / `audience_vote` / `seller_final` set). A new `PeerVote` table (distinct from the existing `Vote` table used for public voting) records `round_id`, `voter_submission_id` (which creator cast the vote — needed for the participation gate, but never exposed to other creators), and `submission_id` voted for. A `votes_cast_count` counter per creator per round drives the gate: the app checks this before revealing that creator's advance/eliminate result or sending the round-1 outcome notification.

## Anti-sabotage guardrails (as decided)

Blind pairwise comparison stays the vote mechanic at every peer-vote stage — a creator only ever sees two anonymized teasers/clips side by side, never who made them, so there's no way to target a specific rival. The participation gate (vote on N peers to unlock your own result) forces genuine engagement rather than a single drive-by downvote. Coordinated-voting pattern detection (flagging small groups that consistently vote the same way) was discussed but deferred — worth adding to the backlog once there's real voting data to tune thresholds against, not a day-one build item.

## Consequences

- The competition now has three distinct judging mechanisms (seller light score, peer vote, public vote) instead of two — more interesting and gamified, but also more states to build, test, and explain to users in onboarding/help copy.
- The participation gate means round-1 results can't all be revealed the instant the round closes — there's a short window where the app is waiting on stragglers to cast their required votes. Needs a clear deadline (e.g. results reveal 2 hours after round close regardless, with non-voters penalized or auto-eliminated for non-participation) so the funnel doesn't stall.
- Teasers being short and low-effort likely means round 1 gets much higher submission volume than round 2 — good for top-of-funnel engagement, but the peer-vote and scoring pipeline needs to handle a submission count an order of magnitude larger than what full-content rounds see.
- Non-participation in peer voting needs a defined penalty (auto-elimination, or just being excluded from that round's ranking) — this wasn't explicitly decided and should be resolved before this goes into engineering tickets.

## Action items

1. [ ] Add `phase` to `Submission`, update `Round.type` enum, add `PeerVote` table and `votes_cast_count` tracking
2. [ ] Build the participation-gate check (block result reveal / send reminder notification until N votes cast)
3. [ ] Define the non-participation penalty for round-1 peer voting (open question above)
4. [ ] Build seller light-score UI (1-5 quick rate) to replace the old manual-review screen for round 1
5. [ ] Extend the round state machine (ADR-001) to the new three-stage flow
