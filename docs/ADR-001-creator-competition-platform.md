# ADR-001: Core system architecture for creator-competition marketplace

**Note:** the round-1 elimination flow described here (checklist + seller manual cut, then a single audience-vote round) is superseded by ADR-003's teaser + peer-vote redesign. The system architecture below (monolith, stack, data layer, payments, video, identity) still stands as written.

**Status:** Proposed
**Date:** 2026-08-03
**Deciders:** Founder (mortadha), future engineering hires

## Context

The product connects sellers (brands) who post content challenges with cash prizes, and creators who compete for the prize through an elimination format: a checklist + seller manual cut in round 1, then blind-submission audience-vote rounds (verified users only), ending in a seller final pick. Winners get the main prize; all finalists get a guaranteed stipend, funded via escrow at challenge creation.

Constraints from the founder: pre-seed, about to build the MVP, wants the architecture to scale from day one, needs both mobile (iOS/Android) and web, mobile-first, and has no fixed engineering team yet — wants a recommendation that doesn't require a large team to operate.

Given "design for scale" plus "no team yet," the real tension is between building a scalable foundation and staying operable by a tiny (1-3 person) team. The resolution below leans on managed infrastructure that scales horizontally without demanding dedicated ops headcount, rather than hand-rolled distributed systems.

## Decision

Build a **modular monolith** (not microservices) on a mobile-first cross-platform stack, backed by managed infrastructure for the pieces that are hardest to get right in-house: payments/escrow, video hosting, and identity verification. Split the monolith into services later only when a specific module's load or team ownership actually demands it.

## Options considered

### Option A: Microservices from day one

| Dimension | Assessment |
|---|---|
| Complexity | High |
| Cost | High (more infra surfaces, more observability tooling) |
| Scalability | Excellent, but scale isn't the bottleneck at pre-seed |
| Team familiarity | Requires a team that doesn't exist yet |

**Pros:** clean ownership boundaries as the team grows; each round/voting/payment concern scales independently.
**Cons:** massive premature overhead for a team of 1-3; slows MVP delivery; distributed-systems bugs (partial failures, eventual consistency) are exactly what a pre-seed team can least afford to debug.

### Option B: Modular monolith + managed services (recommended)

| Dimension | Assessment |
|---|---|
| Complexity | Low-medium |
| Cost | Low at launch, scales with usage (mostly pay-per-use managed services) |
| Scalability | Good — vertical + read replicas + queue offload gets you well past pilot scale; clear seams to peel off services later |
| Team familiarity | Matches a small/undetermined team; managed services replace specialists you don't have yet |

**Pros:** ship MVP fast; one codebase, one deploy pipeline; module boundaries (Challenges, Submissions, Voting, Payments, Identity) are enforced in code now so extraction later is mechanical, not a rewrite.
**Cons:** eventually the monolith's build/deploy time grows, and voting-spike traffic could contend with the rest of the app for resources if not isolated behind a queue.

### Option C: Serverless-first (functions per endpoint)

| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Cost | Very low at low traffic, can spike unpredictably at high traffic (voting bursts) |
| Scalability | Auto-scales, but cold starts and connection-pooling to Postgres are a real headache for a small team |
| Team familiarity | Requires comfort with a more fragmented mental model |

**Pros:** near-zero idle cost, good fit for the bursty nature of voting rounds.
**Cons:** debugging and local dev are harder; less natural fit for the stateful "round lifecycle" logic that's core to this product.

## Trade-off analysis

The product's real scaling risk isn't steady-state traffic — it's **burst traffic during live elimination reveals**, when a challenge's audience all votes in a short window. That's a queueing/rate-limiting problem, not an argument for microservices. Option B addresses it directly: voting writes go through a queue (see below) so the vote spike never hits Postgres directly, regardless of monolith vs. microservices.

Money (escrow, payouts) and identity (verified voting) are the two places where getting it wrong is expensive or dangerous — those are exactly the pieces to hand to specialized managed providers (Stripe Connect, a KYC/verification provider) rather than build in-house, independent of the architecture style chosen.

## Recommended stack

**Mobile-first client:** React Native (Expo) for iOS + Android from one codebase — right call for mobile-first with an unknown/small team, since you're not maintaining two native codebases. Companion web app in Next.js, sharing a design system and API client with the mobile app.

**Backend:** Node.js + TypeScript (NestJS or a lighter Express/Fastify setup), organized as modules: `challenges`, `submissions`, `rounds-and-voting`, `payments`, `identity`, `notifications`. Each module owns its own DB tables and only talks to others through defined service interfaces — this is what makes future extraction to standalone services cheap if/when a module's load justifies it.

**Database:** Postgres (managed — Supabase, Neon, or RDS). Relational fits this domain well: challenges, rounds, submissions, votes, and payouts are all relationally linked and need transactional integrity, especially around payouts.

**Queue / real-time layer:** Redis + a queue (BullMQ) to absorb vote bursts and drive the elimination-round state machine (auto-close a round, tally, advance) as background jobs rather than request-time logic. WebSockets (or a managed service like Pusher/Ably) push live bracket/elimination updates to clients without polling.

**Video/content:** Mux or Cloudflare Stream for upload, transcoding, and playback — do not build video infrastructure in-house. Submissions store a reference to the hosted asset, not raw video in your own storage.

**Payments/escrow:** Stripe Connect (Standard or Express accounts for sellers/creators). Seller funds a challenge into a Stripe-held balance at creation; platform triggers payout transfers to winner + finalists when a challenge resolves. This avoids the platform ever directly custodying funds or building its own ledger/compliance stack.

**Identity/verified voting:** Phone-number verification (OTP) at minimum for anyone who votes, plus a fraud-signals provider (or Stripe Identity / Persona) if abuse becomes a problem — start simple, add rigor only if bot voting actually shows up in data.

**Hosting:** A managed platform (Render, Fly.io, or Railway) for the backend and a CDN/edge platform (Vercel) for the web app — avoids needing dedicated DevOps until traffic genuinely requires it.

## Core data model (high level)

`User` (role: seller | creator | both) → `Challenge` (seller_id, prize_pool, stipend_pool, status, checklist_criteria) → `Submission` (creator_id, challenge_id, video_ref, status: pending | advanced | eliminated) → `Round` (challenge_id, round_number, type: seller_cut | audience_vote | seller_final, status, opens_at, closes_at) → `Vote` (round_id, voter_id, submission_id) → `Payout` (challenge_id, user_id, amount, type: winner | stipend, status).

The `Round` entity plus a `status` state machine (`open` → `closed` → `tallied` → `revealed`) is the crux of the elimination mechanic — it's what drives the checklist auto-filter in round 1, blind-until-close visibility, and hidden bracket pairing you've already decided on.

## Consequences

- Ships an MVP fast with a team of 1-3, without hand-building payments, video, or identity infra.
- Module boundaries in the monolith mean a future "voting is our bottleneck" problem can be solved by extracting just that module, not re-architecting everything.
- You take on vendor dependency (Stripe, Mux, a verification provider) — acceptable trade at this stage, revisit only if a vendor becomes a genuine cost or capability blocker at scale.
- The queue-backed round state machine needs to be built carefully once (round auto-close, tally, reveal) since it's the mechanic the whole product's "game feel" depends on — worth extra design/testing attention even at MVP stage.

## Action items

1. [ ] Stand up Postgres schema for the six core entities above
2. [ ] Integrate Stripe Connect sandbox for escrow + payout flow (winner + finalist stipend)
3. [ ] Integrate Mux/Cloudflare Stream for submission video upload + playback
4. [ ] Build the Round state machine as a queued background job (open → close → tally → reveal)
5. [ ] Add phone-OTP verification gate on the voting endpoint
6. [ ] Scaffold React Native (Expo) app + Next.js web app against a shared API client
