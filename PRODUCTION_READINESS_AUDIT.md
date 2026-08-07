# MOMENT — Production Readiness Audit

**Auditor:** AI Project Supervisor (architecture / QA / security / DevOps / product review)
**Date:** 2026-08-07
**Scope:** `apps/api` (NestJS modular monolith), `apps/web` (Next.js 14), `apps/api/prisma` schema, `docker-compose.prod.yml` + `deploy/`, project docs/ADRs, TODO.md.
**Method:** Full read of README/ADRs/TODO.md, live `nest build`, live `jest --coverage` run, live `next build`, plus five targeted code audits (backend business logic, security, database schema, frontend, testing/deployment) with findings spot-verified by direct code read where flagged Critical.

---

## 0. Context the rest of this report depends on

This project's own `TODO.md` is unusually candid — it already labels itself pre-production, lists explicitly stubbed/cut features, and names its own biggest risk ("no load/concurrency testing on the round state machine yet... a bug here shows up as *the contest result being wrong*"). This audit treats that document as a starting hypothesis, not a substitute for verification. Where I confirmed a TODO.md claim by reading the actual code, I say so. Where I found something worse than TODO.md admits, I flag it as new.

`README.md` states: **"Launch blocker — sweepstakes and gambling exposure. Unresolved."** This is a legal/regulatory blocker on the Terms of Service and the entire payout mechanic, and it sits outside anything code review can fix. It is the long pole regardless of engineering readiness, and I treat it as a standing Critical throughout this report.

---

## 1. Architecture Overview

- **Backend**: NestJS "modular monolith" (`apps/api`), Postgres via Prisma, Redis + BullMQ for the round state machine (open → closed → tallied → revealed) and scheduled jobs. Modules: `identity` (phone-OTP via Twilio Verify + JWT), `challenges`, `submissions`, `media` (Mux upload/webhooks), `rounds` (the state machine), `voting` (pairwise decks, participation gate, rally/quality split, streaks), `payments` (Stripe Connect escrow, payouts, tiers, wallet), `trust` (bidirectional ratings), `public` (cached SSR spectator API), `notifications`.
- **Frontend**: Next.js 14 App Router (`apps/web`), talks to the API over a typed `api-client.ts`, no server-side rendering of authenticated data (client-fetch pattern). New PWA layer (manifest, service worker, install prompt) — real, not a stub.
- **Database**: Postgres via Prisma ORM, money stored as `Int` cents (correct), strong unique constraints around vote/deck integrity, webhook idempotency ledger.
- **Auth**: Phone OTP (Twilio Verify) → JWT (30-day expiry, no revocation list).
- **Payments**: Stripe Connect — `application_fee_amount` for the platform take, `transfers.create` for payouts (winner/stipend/survivor-bonus/crowd-favourite).
- **External services**: Stripe, Mux (video), Twilio (OTP). All three are "inert without a key" per TODO.md — sandbox-only today.
- **Infrastructure**: Docker Compose (Postgres, Redis, api, web, Caddy for automatic TLS), manual SSH-deploy script. No CI/CD.
- **Main user journeys**: brand creates + funds a challenge → creator submits teaser → blind pairwise peer voting narrows the field → survivors submit full content → final public vote → brand picks winner → escrowed pool pays out across four payout types → wallet/trust/rating update → growth loops (rally links, share cards, public spectator pages) drive the next cycle.

---

## 2. Verified Engineering Facts

I ran these myself rather than trusting docs or agent claims at face value:

| Check | Result |
|---|---|
| `pnpm nest build` (apps/api) | **Failed on first attempt** — `TS2339`, `avatarUrl`/`avatarGeneratedAt` not found on the Prisma `User` type. Root cause isolated: migration `20260807130002_creator_avatar` exists on disk but is **untracked in git**, and the generated Prisma Client in `node_modules` was stale relative to `schema.prisma`. Running `npx prisma generate` and rebuilding **fixed it — exit 0.** Not a real architecture bug, but a real repo-hygiene bug: anyone who clones fresh, or a CI pipeline that doesn't run `prisma generate` before `nest build`, hits a broken build today. |
| `next build` (apps/web) | **Succeeded**, all 15 routes compiled/prerendered. One lint warning: missing `alt` on `results/[submissionId]/opengraph-image.tsx:71`. |
| `jest --coverage` (apps/api) | **47/47 tests passed**, but **overall statement coverage is 6.99%**, branch 12.02%. Every passing test is a pure-function unit test (`pricing.spec.ts`, `tier.spec.ts`, `scoring.spec.ts`, `deck-generation.spec.ts`, `streak.spec.ts`). **Every service, controller, and the entire round state machine shows 0% coverage** — confirmed directly from the coverage table, not inferred. |
| `apps/web` test suite | **Does not exist.** No test runner installed, no `test` script in `package.json`, zero `*.spec/test.ts(x)` files. |
| CI/CD | **Confirmed absent.** No `.github/` directory anywhere in the repo. |
| Stripe idempotency on payouts | **Confirmed absent** by direct read of `apps/api/src/modules/payments/payouts.service.ts:98` — `transfers.create()` is called with no `idempotencyKey`. A retry after a timeout/crash creates a second real money transfer. |
| Health check endpoint | **Confirmed absent** by direct read of `apps/api/src/main.ts` — no `/health` route, no readiness probe. |
| Global rate limiting | **Confirmed absent** by direct read of `main.ts` — `@nestjs/throttler` is a dependency but never bound as a global guard; only `PublicController` uses it locally. |

---

## 3. Findings by Severity

### 🔴 CRITICAL — must fix before any real-money launch

**C1. No idempotency protection on Stripe payout transfers, combined with a non-atomic tally→payout sequence, creates a real double-payment path.**
- **Location:** `apps/api/src/modules/rounds/round-state-machine.service.ts:79-135` (tally trigger), `apps/api/src/modules/payments/payouts.service.ts:85-115` (`transfers.create`).
- **Impact:** `onPeerVoteCast` runs synchronously on every vote write, with no row lock or transactional compare-and-swap on `round.status`. Once the 8-vote participation gate is satisfied, near-simultaneous requests can each pass the gate check before `round.status` flips (it only flips *after* the Stripe payout calls complete), so `tallyAndReveal` can run twice concurrently. Layered on top, `transfers.create` has no `idempotencyKey`, so even a single-threaded retry after a network blip or crash re-sends the transfer. Either path is a real, unrecoverable transfer of platform money to a creator's connected account.
- **Recommended fix:** wrap the gate-check + status transition in a DB transaction with `SELECT ... FOR UPDATE` (or a Prisma optimistic version/status guard on the `UPDATE ... WHERE status = 'open'` clause) so only one caller can flip the round to `tallying`; pass a stable, deterministic `idempotencyKey` (e.g. `payout:${payoutId}`) to every `transfers.create` call.
- **Verification:** add an integration test that fires N concurrent vote-cast requests satisfying the gate simultaneously and asserts exactly one set of `Payout` rows and one Stripe transfer call per (challenge, user, type); add a unit test asserting the same `idempotencyKey` is passed on a simulated retry.

**C2. No DB-level constraint prevents a duplicate payout row for the same (challenge, user, type).**
- **Location:** `apps/api/prisma/schema.prisma`, `Payout` model (~line 330).
- **Impact:** Compounds C1 — even if the application-layer race is fixed today, there is nothing in the schema itself stopping a future code path (a retried job, an admin tool, a bug) from inserting a second `winner` or `stipend` payout for the same user/challenge. This is exactly the kind of guardrail that should live at the database, not only in service logic.
- **Recommended fix:** `@@unique([challengeId, userId, type])` on `Payout` (or a partial unique index excluding `failed` if legitimate retry-after-failure rows are wanted).
- **Verification:** attempt a duplicate insert in a test and confirm Postgres rejects it.

**C3. No production error tracking / APM.**
- **Location:** repo-wide — confirmed no Sentry/Datadog/equivalent in `apps/api` or `apps/web` source (only unrelated transitive lockfile hits).
- **Impact:** A payout bug, a webhook failure, or a round stuck mid-state-machine would be invisible to the team until a user complains. For a product whose core promise is "you get paid," silent failure in the money path is an existential trust risk, not just an ops inconvenience.
- **Recommended fix:** wire up an error tracker (Sentry is the standard NestJS + Next.js choice) before go-live; alert on payout failures and on rounds stuck past `closesAt`/`revealDeadlineAt` (TODO.md already earmarks this as Sprint 4 admin god-view — bring the *alerting* forward even if the god-view UI waits).
- **Verification:** trigger a deliberate exception in staging, confirm it appears in the tracker.

**C4. No backup strategy for Postgres.**
- **Location:** `deploy/DEPLOY.md` — the document itself states, under "what's NOT set up," that the Postgres volume is durable but unbacked-up, and describes a manual `pg_dump` as the "minimum viable version."
- **Impact:** This database is the system of record for escrow, payouts, and vote history — the exact data a business cannot afford to lose or be unable to prove. A host failure or bad migration with no backup is a business-ending event, not a technical inconvenience.
- **Recommended fix:** automate `pg_dump` (or Postgres WAL archiving) to off-host storage on a schedule before launch; this is cheap relative to everything else on this list.
- **Verification:** perform a restore drill from a generated backup into a scratch DB.

**C5. No CI pipeline gates deploys.**
- **Location:** repo-wide — no `.github/` directory; `deploy/deploy.sh` is a manual SSH script (`git pull` → `docker compose build` → `up -d` → `prisma migrate deploy`).
- **Impact:** Even the 47 tests that do exist provide zero protection today, because nothing runs them before a deploy. The build-breaking Prisma-client drift found in §2 is exactly the class of bug CI exists to catch before it reaches a server.
- **Recommended fix:** minimum viable CI: on every push, run `prisma generate && nest build && jest` for the API and `next build` for web; block merge/deploy on failure.
- **Verification:** open a PR that reintroduces the drift bug and confirm CI fails it.

**C6. No rate limiting on authentication or vote-casting endpoints.**
- **Location:** `apps/api/src/main.ts` (no global `ThrottlerGuard`), `apps/api/src/modules/identity/auth.controller.ts:17-35` (OTP request/verify), `apps/api/src/modules/voting/voting.controller.ts` (vote casting).
- **Impact:** `@nestjs/throttler` is installed and configured in `public.module.ts` but only applied to `PublicController` — never bound globally via `APP_GUARD`. `POST /auth/otp/request` can be spammed for SMS-pumping fraud against the project's own Twilio bill; `POST /auth/otp/verify` has no app-level brute-force protection beyond whatever Twilio Verify does internally. Vote-casting endpoints are similarly unthrottled — DB unique constraints stop duplicate votes, but not request-flood/credential-stuffing traffic.
- **Recommended fix:** bind `ThrottlerGuard` globally via `APP_GUARD` in `app.module.ts`, with a tighter override on `/auth/otp/*`.
- **Verification:** script N rapid requests against `/auth/otp/request` from one IP in staging, confirm a 429 after the configured threshold.

**C7. The legal/regulatory blocker on sweepstakes and gambling exposure remains genuinely unresolved** (per README.md, in the project's own words: "not resolvable in design"). No engineering fix addresses this. It gates the Terms of Service and the entire payout mechanic. **NOT VERIFIED as resolved — treat as open.**

### 🟠 HIGH

**H1. Round state machine and every money-moving service have 0% test coverage.** Confirmed directly from the coverage report: `round-state-machine.service.ts`, `payouts.service.ts`, `funding.service.ts`, `wallet.service.ts`, `voting.service.ts`, `webhooks.controller.ts` are all at 0%. Only the pure-math helpers underneath them are tested. The project's own TODO.md flags "no load/concurrency testing on the round state machine" as the single biggest technical risk — this audit confirms it's also true at the unit/integration level, not just load.

**H2. A creator can submit twice for the same challenge phase.** `apps/api/src/modules/submissions/submissions.service.ts:32` plus no unique constraint in the schema — tallying has no per-creator dedup, so a duplicate submission can occupy two of a round's `advanceCount` slots.

**H3. `scheduleRoundJobs` is not transactional with the round insert** (confirmed — matches TODO.md's own claim). `apps/api/src/modules/rounds/rounds.service.ts:192`. A Redis outage right after the DB commit strands a round with no scheduled close/reveal job, and there's currently no repair mechanism (Sprint 4's planned admin god-view is meant to catch this but doesn't exist yet).

**H4. `next.config.js` currently disables `output: "standalone"`, but `Dockerfile:31` copies `.next/standalone`.** As committed, the production Docker build path is broken — this isn't the documented Windows-only EPERM issue, it's unconditional. Confirm before the next deploy attempt.

**H5. No page-level auth guard on protected frontend routes.** `/wallet`, `/rounds/[id]` and others fire authenticated API calls with no check for a missing/expired session; an unauthenticated or logged-out visitor gets a silently stuck loading state instead of a redirect to `/login?returnTo=...`. The `returnTo` flow exists but nothing triggers it except one manual link.

**H6. Systemic missing error handling on the frontend.** The majority of data-fetching pages (`challenges`, `discovery`, `wallet`, `me`, `rounds/[id]`, `challenges/[id]`) call the API with no `.catch`/try-catch. A network failure or 4xx/5xx leaves the page stuck on its loading/null state indefinitely, with no retry and no user-facing error message.

**H7. 30-day JWTs with no revocation mechanism.** `apps/api/src/common/config/configuration.ts:16` defaults to `JWT_EXPIRES_IN=30d`; the auth guard only checks the user still exists, not any session/blocklist state. A stolen or leaked token is valid for a month with no way to force logout.

### 🟡 MEDIUM

**M1. The `20260807130002_creator_avatar` migration and the `avatarUrl`/`avatarGeneratedAt` schema fields are currently uncommitted (untracked in git).** This is what caused the build failure in §2. Fix by committing the migration alongside the schema change, and add `prisma generate` as an explicit CI/build step so this class of drift is caught automatically.

**M2. No `CHECK` constraint preventing negative payout/pool amounts** at the database level (`Payout.amount`, `Challenge.prizePool`, `Challenge.stipendPool` are plain `Int`). Currently enforced only in application code.

**M3. Rally-attribution endpoint accepts any `creatorId`/`campaignId` from any authenticated user with no check that the named creator is actually competing in that campaign.** `apps/api/src/modules/voting/voting.controller.ts:57`. Since attribution taint edges are permanent (by design, per ADR-005), this is exploitable to shrink a rival's eligible quality-vote pool.

**M4. `GET /users/me` returns the raw Prisma `User` entity with no explicit DTO/serialization allow-list.** Correct today (only the caller's own record), but any sensitive field added to `User` later (KYB internals, `stripeConnectAccountId`) is automatically exposed with no review gate.

**M5. Minimal client-side form validation** — challenge creation has no upper bound on prize pool, no format enforcement on hashtag fields; submission upload has no client-side file-size/duration check before hitting Mux.

**M6. Core vote-pairing UI is not keyboard-accessible.** `VoteDeck.tsx:84-88` — pair options are `<div onClick>`, not `<button>`; no focus, no `role`, unreachable by keyboard or screen reader on what is arguably the single most important interaction in the product.

**M7. No composite index backing "does payout X exist for user Y in challenge Z" lookups** (relevant once C2's unique constraint is added — same index serves both purposes).

### 🟢 LOW

- CORS falls back to `http://localhost:3001` if `CORS_ORIGIN` is unset in prod (`main.ts:20`) — silent misconfiguration rather than a loud startup failure.
- `Rating.score` / `Submission.sellerScore` have no DB-level 1–5 bound, app-enforced only.
- `ReferralReward.status` and `Dispute.raisedById/resolvedById` lack indexes (low-cardinality admin tables, low urgency).
- `isAttentionCheckConsistent` in `deck-generation.ts` is unit-tested but never called — `deck.service.ts` reimplements the same check inline, risking silent drift between the two.
- Missing `alt` text on `opengraph-image.tsx:71`, and empty `alt=""` on several avatar images app-wide.
- Reveal-phase notification fan-out is sequential per creator rather than batched (`round-state-machine.service.ts:334`) — a minor perf issue that also widens C1's race window for large cohorts.
- Postgres/Redis containers have Docker healthchecks; the `api`/`web` containers do not, and Caddy has no `condition: service_healthy` dependency on them.

### ✅ What's genuinely solid (don't re-litigate these in a fix sprint)

- IDOR/ownership checks are consistently correct on money-moving endpoints (funding, round-opening, submission-scoring, deck access, Mux upload authorization) — traced directly, not assumed.
- Both Stripe and Mux webhook handlers verify signatures and dedupe via a `WebhookEvent(provider, eventId)` unique constraint before processing.
- `class-validator` DTOs are applied consistently; `main.ts` globally enforces `whitelist`/`forbidNonWhitelisted`/`transform`.
- No raw SQL (`$queryRaw`/`$executeRaw`) anywhere — no SQL injection surface.
- No hardcoded secrets in source; `.env*` correctly gitignored; `.env.production.example` contains only placeholders.
- Money stored as `Int` cents throughout — no float-rounding risk.
- Vote-integrity unique constraints are correct and well-designed (`Vote@@unique([roundId, voterId])`, `PeerVote@@unique([deckId, pairIndex])`, `Deck@@unique([userId, roundId])`, `RallyAttribution@@unique([voterId, creatorId])`).
- Composite scoring math (70% peer / 30% brand) and the quality/rally pool split genuinely match ADR-003/ADR-005 — verified by reading the implementation against the spec, not just trusting the docs.
- PWA layer (manifest, service worker, install prompt, icons) is real and functionally sound — caches app shell, correctly skips cross-origin/API requests, icons are valid non-empty PNGs.
- Empty states and responsive/touch-target CSS (`.pair-row` stacking under 480px, ≥48px buttons) are genuinely implemented as TODO.md claims.
- `next build` and (after `prisma generate`) `nest build` both succeed cleanly; `pricing.spec.ts`/`scoring.spec.ts` are thorough for the math they cover.

---

## 4. Critical User-Flow Test Plan (recommended, mapped to current coverage)

| # | Flow | Current coverage | Priority to add |
|---|---|---|---|
| 1 | Phone OTP request/verify + JWT issuance | None | High |
| 2 | Challenge creation + Stripe escrow funding (incl. webhook-driven state transition) | None (only fee math tested) | Critical |
| 3 | Video submission + Mux webhook processing | None | High |
| 4 | Round open → close → tally → reveal, incl. concurrent vote race | Math only, no orchestration/concurrency test | Critical |
| 5 | Pairwise vote cast + 8-vote participation gate enforcement | Generation/gate math only | Critical |
| 6 | Payout triggering — all four types, incl. retry/idempotency | None | Critical |
| 7 | Wallet balance read/update | None | Medium |
| 8 | Rating/trust submission and public trust stats | None | Medium |
| 9 | Referral / rally attribution recording | None | Medium |
| 10 | Logout / token expiry / protected-route redirect | None (frontend has no guard to test) | High |

---

## 5. Production Readiness Score

| Category | Weight | Score /100 | Rationale |
|---|---|---|---|
| Functionality | 20% | 70 | Core flows are implemented and match the ADR spec closely (verified, not assumed). Sprint 2–5 features (tiers, streaks, discovery, PWA) are landing but several are mid-flight/untracked in git. |
| Security | 20% | 60 | Authorization/IDOR is genuinely solid and webhook signatures are verified — better than most pre-launch apps. But zero rate limiting on auth/voting and no idempotency on money transfers are launch-blocking. |
| Reliability | 15% | 35 | No error tracking, no backups, no health checks, a confirmed double-payout race, and a non-transactional job-scheduling gap the team already knows about. This is the weakest category. |
| Code quality | 10% | 70 | Clean module separation, consistent DTO/validation patterns, money-as-cents, no dead SQL/injection surface. Some drift risk (untracked migration) and a few inline-vs-shared-logic duplications. |
| Testing | 10% | 25 | 47 passing tests but 6.99% statement coverage; every service/controller/state-machine is 0%; zero frontend tests; zero e2e; no CI to run any of it. |
| Performance | 10% | 65 | No load/concurrency testing performed or possible to verify (NOT VERIFIED at scale). Indexing is mostly good; a few composite-index gaps identified. Frontend bundle sizes are reasonable (86-106 kB first load). |
| Infrastructure/Deployment | 10% | 45 | TLS via Caddy, volumes persisted, secrets sourced from env correctly, restart policies set — good bones. But no CI/CD, no backups, no health checks, and the Docker `standalone` build path currently appears broken. |
| UX/Product readiness | 5% | 55 | Empty states and responsive/PWA work are real. But missing auth guards and systemic unhandled fetch errors mean real users will hit visibly broken/stuck screens. |

**Weighted score: ≈ 54 / 100**

**Classification: 🟠 Not Ready — Significant work required** (50–74 band). It sits at the low end of that band because the reliability and testing gaps compound a launch-blocking legal question that engineering cannot resolve on its own.

---

## 6. Final Launch Decision

# NO-GO

The application should not be released to real users or real money yet. This is not a verdict on the team's engineering — the core domain logic (scoring, vote integrity, IDOR checks, webhook handling) is genuinely well-built and matches its own spec. The gap is entirely in the safety net around that logic: nothing catches a bad deploy, nothing catches a stuck round, nothing catches a duplicate payout, and nothing catches data loss.

### Critical Blockers (must fix before GO)
1. Legal/regulatory review of sweepstakes/gambling exposure (README's own standing blocker — start in parallel with everything below, it's the longest pole).
2. C1 — Round-tally / payout race condition + Stripe idempotency key (real double-payment risk).
3. C2 — DB unique constraint on `(challengeId, userId, type)` for `Payout`.
4. C3 — Error tracking / APM wired up.
5. C4 — Automated Postgres backups with a tested restore path.
6. C5 — Minimal CI pipeline gating build + test on every push.
7. C6 — Global rate limiting on auth and voting endpoints.

### Pre-Launch Checklist
- [ ] Commit the `creator_avatar` migration; add `prisma generate` as an explicit CI/build step.
- [ ] Fix the `next.config.js` standalone-output vs `Dockerfile` mismatch (H4) and do one real Docker prod build end-to-end.
- [ ] Add integration tests around funding webhook → payout trigger, and the round state machine under concurrent load (H1).
- [ ] Add a per-creator unique submission constraint per phase (H2).
- [ ] Make `scheduleRoundJobs` transactional with the round insert, or add a repair/reconciliation job (H3).
- [ ] Add frontend auth guards on protected routes + global fetch error handling (H5, H6).
- [ ] Add `/health` endpoint and Docker healthchecks on `api`/`web`; gate Caddy on them.
- [ ] Decide and implement a JWT revocation/shorter-expiry strategy (H7).
- [ ] Restore-drill the new backup process before trusting it.

### Recommended Fix Order
1. Legal review kickoff (parallel-track, don't block engineering on it, but don't let it slip either).
2. C1 + C2 (payout race + DB constraint) — this is real money, fix before anything else code-side.
3. C5 (CI) — every other fix needs a safety net to land safely.
4. C3 + C4 (monitoring + backups) — cheap, fast, and the two blockers a bad week without them would be unrecoverable.
5. C6 (rate limiting) — small, mechanical fix (bind `ThrottlerGuard` globally).
6. H1/H2/H3 (round state machine hardening + tests).
7. H4/H5/H6 (deploy-path fix + frontend resilience).
8. Everything in Medium/Low as ongoing hardening post-fix-sprint.

### Post-Launch Recommendations (not blockers)
- Build out the Sprint 4 admin god-view (stuck-round detection, manual repair) — directly mitigates H3's blast radius.
- Expand test coverage past the critical-money-path minimum toward the full flow list in §4.
- Accessibility pass on the vote-deck UI (M6) — meaningful given voting is the core mechanic.
- Composite indexes and CHECK constraints (M2, M7) as the dataset grows.
- Frontend unit/e2e test suite — currently zero.

---

*Everything in this report was verified by direct code read, a live build/test run, or explicit sub-agent investigation with file:line citations — not inferred from documentation alone. Where verification wasn't possible in this environment (e.g., production-scale load/concurrency behavior), it is marked NOT VERIFIED rather than assumed safe.*
