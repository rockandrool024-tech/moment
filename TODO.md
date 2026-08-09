# Perokio — build status (formerly MOMENT)

Living tracker, updated as work lands. See `docs/` for the product spec/ADRs (locked — see
[README.md](README.md)) and `apps/api/README.md` / `apps/web/README.md` for module-level notes.

## Done

**Backend spine** — schema for the full competition/escrow/voting/trust/growth data model, Stripe
Connect escrow + payouts (winner/stipend/survivor-bonus/crowd-favourite), Mux video upload, phone-OTP
identity, and the BullMQ round state machine (open → closed → tallied → revealed) with the ADR-003
participation gate and ADR-005 quality/rally vote split.

**Web client (Phase 1b)** — OTP login, challenge create/fund, submission + video upload, blind
pairwise voting, public voting, wallet, ratings.

**Growth loops** — personal rally links + "your voters" counter + rally XP, share cards
(advance/knockout/win tones via `next/og`), public no-login SSR spectator pages with a cached
rate-limited API surface.

**Sprint 1 (trust & money correctness)** — wallet summary endpoint/page, bidirectional ratings +
public trust stats (ADR-004), KYB gate (admin-reviewed flag) on funding, survivor-bonus/
crowd-favourite payouts actually triggered (was a schema-supported-but-never-fired bug), server-derived
round scheduling (`POST /challenges/:id/rounds/auto`), live vote count + "Vote for me" on the
entry/share-card page, `?returnTo=` on login.

**Sprint 2 (retention & social proof)** — tiers wired end-to-end (badge on profile/entry/OG
image), voting streaks (pause-not-break, `GET /users/me/streak`, flame/pause UI on `/me`),
discovery feed (`GET /public/discovery/creators` / `/brands`, `/discovery` tabs page), PWA infra
(manifest, app-shell service worker, custom install prompt after 2nd visit, responsive pass —
`.pair-row` stacks under 480px, buttons ≥48px), AI-avatar stub (deterministic identicon,
Redis-cached, `POST /users/me/avatar/generate` + public `GET /users/:id/avatar.png`, shown on
profile/discovery/results/share-card).

**Sprint 3 (brand tools)** — campaign funding wizard (auto-opens round 1 once the funding webhook
confirms, no separate manual step), round-3 seller final pick (`PATCH /rounds/:id/final-pick`,
falls back to top-quality-vote automatically), campaign analytics (`GET /challenges/:id/analytics`
— submission funnel, votes per round, payouts by type — `/challenges/:id/analytics` page), invite
creators (`POST /challenges/:id/invite`, reuses the discovery feed + notification queue).

**Fixed: round-3 payout bug** — `tallyPublicFinal` queried `status: "pending"` for finalists, but
round 2's own tally already flips them to `"advanced"` — the query always returned zero rows, so
the winner/stipend/crowd-favourite payout block silently never ran. Caught while wiring seller
final-pick; fixed and covered by `apps/api/scripts/verify-round3-payout.ts` (seeds real DB state,
runs the actual state machine, asserts the winner payout exists, cleans up after itself).

**UI alignment pass** — extended `/map`'s design system (tier color scale, icon set, presence
rings, elevated cards, sheet motion) app-wide: shared CSS tokens (`--tier-0..3`, `--rally`) in
`globals.css`, `.badge-tier` colored tier badges everywhere one renders, icon rollout replacing
emoji/text across nav/streak/KYB/wallet/rally/share, a shared `Avatar` component (presence ring)
and `Sheet` component (bottom-sheet with the map's rise animation, reused for the funding
breakdown and rating confirm), elevated/interactive cards on challenges + discovery, a styled
video dropzone on submit, NavBar active-route highlighting, and a `/map?pin=` deep link from
Discovery. Also fixed a real regression the pass caught: the mobile `button, .btn { width: 100% }`
rule was stretching `/map`'s small icon buttons — scoped to an opt-in `.btn-block` instead.

**Production-readiness fixes** (from a full audit — see `PRODUCTION_READINESS_AUDIT.md`) —
fixed a real double-payout race (`RoundStateMachineService.tallyAndReveal` now atomically claims
the round via a conditional `status: "closed" → "tallied"` update before running payout logic,
closing the window where a vote-triggered tally and a scheduled-job tally could both fire), added
a DB-level `@@unique([challengeId, userId, type])` on `Payout` as a backstop, added a Stripe
`idempotencyKey` on every transfer (keyed on the Payout row's own id) so a retried request can't
double-transfer, added `GET /health` (DB-checking, unauthenticated, wired into
`docker-compose.prod.yml`'s healthcheck so `web`/`caddy` wait for a real-ready `api`), and bound
`@nestjs/throttler` globally (previously only `PublicController` was rate-limited — auth/OTP and
everything else had none).

**UX fixes** (from a full audit — see `UX_EXPERIENCE_AUDIT.md`) — replaced an internal debug
message ("expected without a real MUX_TOKEN_ID…") that was shipping as user-facing copy on a
failed video upload, added the missing `displayName` render on `/me` (previously led with phone
number), gave `/` a real landing page instead of a blank redirect flash, moved the login role
picker to the phone step (was appearing after the OTP was already sent), and corrected the avatar
copy from "AI-generated" to "generated placeholder" (it's a seeded identicon, not AI).

**Deploy stack** (prepared, not live) — Dockerfiles for both apps, `docker-compose.prod.yml`
(Postgres, Redis, api, web, Caddy for automatic TLS), `deploy/DEPLOY.md` + `deploy.sh`.

**Sprint 2.5 (Zenly-style discovery map)** — CSS-generated 3D city map, avatar presence rings,
challenge pins, `GET /public/map/nearby`, `/map` page with a pin-detail sheet; real map
tiles/geocoding/live-presence explicitly stubbed (laid out for feel, not GPS).

**Sprint 4 (growth & ops)** — Referrals (loop 3): `ReferralReward` ledger, signup attribution via
`/r/[code]` → `?ref=` on login (distinct from the rally link, which needs a live battle to resolve
to), reward fires on the referred user's first submission *or* first vote — whichever comes first,
atomically claimed so it only ever fires once — `$5` platform-funded `referral_bonus` payout,
`GET /users/me/referrals` + stats on `/me`. Notifications as a real in-app inbox (`readAt`-driven,
`GET /notifications`, bell + unread badge in the nav) — the processor now writes real copy per
event (payout amount/type, round number, invite) instead of just logging; still no push/SMS/email
channel. Admin module: `ADMIN_PHONE_NUMBERS` allowlist guard (`AdminGuard`, composed on
`JwtAuthGuard`), god-view (`GET /admin/challenges` + detail), stuck-round list + force-reveal
(reuses `RoundStateMachineService.forceRevealDeadline`), manual submission elimination, KYB
approve/reject queue, dispute raise (`POST /submissions/:id/dispute`, creator-side) + resolve
(admin-side — upholding reinstates the submission to `pending`), growth dashboard (vote-deck
completion rate, entries/campaign, brand repeat rate, time-to-first-payout, rally k-proxy —
D1/D7/D30 explicitly returns "needs a cohort table," not faked), `/admin` page (unlinked from nav,
reached directly, still fully guarded server-side).

**Perokio rebrand + Story/Claim data model** — renamed MOMENT → Perokio across every user-facing
string (nav, login, landing page, share cards, manifest, offline page); internal package names
(`@moment/api`/`@moment/web`) deliberately left as-is for now. Added `Story`/`StoryClaim`/`Content`/
`ExternalPost` as new, additive models — `Story` generalizes `Challenge` (a funded, competitive
brief is a Story with `mode: CHALLENGE`, linked via an optional `Story.challengeId`; a free brief
is `mode: OPEN` and has no Challenge at all, so it skips the escrow/round machinery entirely).
Nothing existing was renamed or removed, and a backfill script
([backfill-stories.ts](apps/api/scripts/backfill-stories.ts)) links every pre-existing Challenge to
a generated Story row. New `StoriesModule`: create/list a Story, claim it, attach content plus
optional external post links. Also shipped a Creator Journey feature
([journey.ts](apps/api/src/modules/identity/journey.ts), `GET /users/me/journey`, a `JourneyStepper`
on `/me`) — six milestones, all derived from data that already existed.

**Important, deliberate boundary:** this pivot was checked against prior art before being built —
`docs/prompt-v2-journey-and-3d-map.md` and this README's own "Explicitly rejected" section already
rejected CPM/external-view-based rewards and off-platform-only distribution, for documented reasons
(follower count buying outcomes, unverifiable self-reported view counts, an emptied spectator
feed). That rejection stands. `ExternalPost.views`/`.likes` are creator-entered and shown only on
the creator's own dashboard — no scoring, tallying, or payout code path reads them, and none should
be added without first revisiting that decision explicitly. `User.perokioScore` exists as a
nullable column for a future analytical companion to `tier`; nothing computes it yet.

## Sprint 5 (lower priority — depth)

- [ ] Predictions (`Prediction` table exists, unused) — locked-until-close picks for non-entrants,
      scored into `tasteScore`
- [ ] In-person campaigns — `Slot`/`SlotBooking`, QR-code check-in (not GPS), no-show handling
- [ ] AI creative-studio — real credit ledger + moderation gate + async job queue, generation
      client inert without a Fal.ai/Replicate key (same posture as Stripe/Mux/Twilio)

## Explicitly stubbed or cut (not silently dropped)

| Item | Status | Why |
|---|---|---|
| AI image/video generation | Stubbed | Needs a real Fal.ai/Replicate account |
| KYC document verification | Stubbed (admin flag only) | Real Stripe Identity/Persona integration is its own project |
| GPS geofencing (in-person check-in) | Stubbed (QR-code instead) | Geofencing is a native-mobile-GPS mechanic; this is a web app |
| Push/SMS/email notification delivery | Stubbed (in-app list only) | Needs real FCM/Twilio/SES credentials |
| Coordinated vote-fraud detection | **Cut, not stubbed** | Docs say it needs real voting data to tune thresholds — a fake version would be actively misleading |
| Native mobile app (React Native/Expo) | **Cut, replaced** | Building a responsive installable PWA instead — one codebase, no app-store cycle |
| Full pre-auth "count vote then verify" flow | Deferred | Bigger transactional change than a single sprint; current flow gates the vote action behind login, not the page view |
| Campaign analytics PDF export / cross-campaign benchmarking | Deferred | Real asks, second layer on top of the funnel-counts analytics endpoint |
| Ad-based streak recovery | Cut | No ad SDK integrated; streak auto-resumes on next real vote instead |

## Known limitations

- No load/concurrency testing on the round state machine yet — the docs call it "the crux," and a
  bug here shows up as *the contest result being wrong*, not a UI glitch.
- `scheduleRoundJobs` isn't transactional with the round insert — a Redis outage right after a
  commit leaves a round with no scheduled close/reveal job. The admin god-view's stuck-round list
  (`GET /admin/rounds/stuck` + force-reveal) now catches this, but it's a manual check, not an alert.
- No e2e tests — unit tests cover the pure-function logic (scoring, pricing, deck generation) only.
- Windows dev note: `next build`'s `output: "standalone"` fails locally with an `EPERM` symlink
  error (pnpm + Windows without Developer Mode) — harmless, doesn't occur in the Linux Docker build.

## What's actually gating a real launch (not engineering)

1. **Legal/regulatory review** — the product docs call sweepstakes/gambling exposure "existential"
   and "not resolvable in design." Blocks the Terms of Service and the payout logic. Start this in
   parallel with everything else — it's the longest pole.
2. Provider accounts going from sandbox to live (Stripe Connect, Mux, Twilio Verify) — mostly
   account review time, not code.
3. Finishing Sprints 2-5 above + the load-testing item.
4. Cold-start execution (10 local brands + 50 hand-recruited creators) — calendar time, not code.
