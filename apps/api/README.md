# @moment/api

The MOMENT backend — a modular monolith (NestJS) per [ADR-001](../../docs/ADR-001-creator-competition-platform.md).

Current coverage: the Phase 1 spine (schema, escrow, video upload, the round state machine,
phone-OTP-gated voting), the growth loops (rally links, share cards, public spectator API), and
Sprints 1-3 of the post-launch build-out (wallet/trust/KYB, tiers/streaks/discovery/PWA/avatar,
campaign wizard/final-pick/analytics/invites). See [/TODO.md](../../TODO.md) at the repo root for
what's built vs. still open across every sprint.

## Modules

| Module | Owns |
|---|---|
| `identity` | Users, phone OTP (Twilio Verify), JWT issuance, KYB request, AI-avatar stub (`POST /users/me/avatar/generate`, public `GET /users/:id/avatar.png`) |
| `challenges` | Challenge CRUD + status lifecycle, seller analytics funnel (`GET /challenges/:id/analytics`), invite creators (`POST /challenges/:id/invite`) |
| `submissions` | Submission CRUD, teaser/full-content phases, checklist auto-filter |
| `rounds` | **The round state machine** — open → closed → tallied → revealed, driven by BullMQ. `POST /challenges/:id/rounds/auto` server-derives the next round's type/advanceCount/schedule; `PATCH /rounds/:id/final-pick` lets the seller override the round-3 winner before close |
| `voting` | Blind pairwise peer-vote decks (rounds 1-2), public quality/rally voting (round 3), rally-link resolution + stats, voting streaks (`streak.ts` pure logic + `StreakService`, `GET /users/me/streak`) |
| `payments` | Stripe Connect escrow funding + payout transfers (winner/stipend/survivor-bonus/crowd-favourite), Connect onboarding, wallet summary, tier computation, webhooks |
| `trust` | Bidirectional ratings + public creator/brand trust stats (ADR-004) |
| `media` | Mux direct uploads + asset-ready webhook |
| `public` | Cached, rate-limited no-auth reads for the spectator battle pages (ADR-002) + discovery feed (`GET /public/discovery/creators` / `/brands`) |
| `notifications` | Queue-backed stub — no delivery channel wired up yet; `challenge_invite` is the newest event type |

## Local development

Requires Docker (Postgres + Redis) and pnpm.

```bash
docker compose up -d          # from the repo root — starts Postgres + Redis
cp apps/api/.env.example apps/api/.env
pnpm install
pnpm --filter @moment/api prisma:migrate
pnpm --filter @moment/api start:dev
```

The server boots fine with placeholder Stripe/Mux/Twilio keys in `.env` — those
integrations only throw once you actually call an endpoint that needs them.

### Seeding a dev-only test account

The normal login flow needs a real Twilio account to send an OTP. To get a working, phone-verified
account (and a matching JWT) without one:

```bash
pnpm --filter @moment/api exec ts-node -T scripts/create-test-user.ts \
  --phone "+15550001111" --role creator --name "Ana"
```

Prints the created `User` row and an `accessToken` you can drop straight into the web app's
`localStorage` (`moment.accessToken`). Dev-only — never run against a production database.

## Testing

```bash
pnpm --filter @moment/api test
```

Unit tests focus on the highest-risk pure logic: round state machine scoring/gating math
(`src/modules/rounds/scoring.spec.ts`), blind-pairwise deck generation + attention-check
(`src/modules/voting/deck-generation.spec.ts`), and escrow/payout economics
(`src/modules/payments/pricing.spec.ts`).

## Design notes worth knowing before you touch `rounds/`

- **Round lifecycle is entirely queue-driven** (`round-state-machine.service.ts`),
  never request-time logic. `close-round` and `reveal-deadline` are BullMQ
  jobs scheduled at round creation.
- **Peer-vote rounds** (`peer_vote_teaser`, `peer_vote_narrow`) close at
  `closesAt` but keep accepting peer votes from stragglers until either (a)
  every active creator hits the participation gate (checked after every vote
  cast) or (b) `revealDeadlineAt` (`closesAt` + 2h) forces it — this is
  ADR-003's stall-prevention design, not a bug.
- **`public_vote_final`** has no participation gate — it tallies and reveals
  immediately on close, and triggers winner/stipend/survivor-bonus/crowd-favourite payouts.
- Composite score = 70% peer-vote win rate + 30% normalized seller score,
  with a ×0.9 penalty for under-participating creators — this penalty value
  is flagged in ADR-005 as **still a placeholder**, not a settled number.
- `POST /challenges/:id/rounds/auto` checks the *previous round's own status*
  (`revealed`), not just `Challenge.status` — the latter can't distinguish
  "round still running" from "round done," since it doesn't change until the
  *next* round is created.
- Round `advanceCount` for auto-created rounds is a fixed cap (12 / 4 / 4),
  not derived from a live submission count — at round-creation time (when a
  round *opens*), that round's entries don't exist yet. `rankAndSelectAdvancers`
  (`scoring.ts`) already advances everyone when the cap exceeds the actual
  field size, so a fixed cap is correct regardless of turnout.
- KYB is an **admin-reviewed boolean flag** (`User.kybVerified`), not real
  document verification — gates `POST /challenges/:id/fund`, not challenge
  creation, so a seller can draft before completing verification.

## Known limitations

- `RoundStateMachineService.scheduleRoundJobs` isn't transactional with the round-insert — if
  Redis is down right after a successful commit, the round exists with no scheduled close/reveal
  jobs. `GET /admin/rounds/stuck` (past `closesAt` still `open`, or past `revealDeadlineAt` still
  not `revealed`) + `POST /admin/rounds/:id/force-reveal` catch this — manually, not via an alert.
- No load testing yet on the round state machine under concurrent voting — see the root
  [TODO.md](../../TODO.md).
