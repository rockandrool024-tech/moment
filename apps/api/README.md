# @moment/api

The MOMENT backend — a modular monolith (NestJS) per [ADR-001](../../docs/ADR-001-creator-competition-platform.md).
This is **Phase 1: the spine** (see the root [README](../../README.md)'s build order) — schema,
escrow, video upload, the round state machine, and phone-OTP-gated voting. No client app yet.

## Modules

| Module | Owns |
|---|---|
| `identity` | Users, phone OTP (Twilio Verify), JWT issuance |
| `challenges` | Challenge CRUD + status lifecycle |
| `submissions` | Submission CRUD, teaser/full-content phases, checklist auto-filter |
| `rounds` | **The round state machine** — open → closed → tallied → revealed, driven by BullMQ |
| `voting` | Blind pairwise peer-vote decks (rounds 1-2) + public quality/rally voting (round 3) |
| `payments` | Stripe Connect escrow funding + payout transfers, webhooks |
| `media` | Mux direct uploads + asset-ready webhook |
| `notifications` | Queue-backed stub — no delivery channel wired up yet |

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

## Testing

```bash
pnpm --filter @moment/api test
```

Unit tests focus on the highest-risk logic per ADR-001: the round state
machine's scoring/gating math (`src/modules/rounds/scoring.spec.ts`) and the
blind-pairwise deck generation + attention-check logic
(`src/modules/voting/deck-generation.spec.ts`).

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
  immediately on close, and triggers winner/stipend payouts.
- Composite score = 70% peer-vote win rate + 30% normalized seller score,
  with a ×0.9 penalty for under-participating creators — this penalty value
  is flagged in ADR-005 as **still a placeholder**, not a settled number.
- Survivor-bonus and crowd-favourite payouts (ADR-005) are **not** triggered
  yet — the `Payout.type` enum includes them, but wiring the actual payout
  logic is Phase 3 scope per the root README's build order.
