# MOMENT — build status

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

**Deploy stack** (prepared, not live) — Dockerfiles for both apps, `docker-compose.prod.yml`
(Postgres, Redis, api, web, Caddy for automatic TLS), `deploy/DEPLOY.md` + `deploy.sh`.

## Next — Sprint 2.5 (Zenly-style discovery map)

- [ ] CSS-generated 3D city map, avatar presence rings, challenge pins, `GET /map/nearby`; real map
      tiles/geocoding/live-presence explicitly stubbed

## Sprint 4 (growth & ops)

- [ ] Referrals (loop 3): `ReferralReward` ledger, attribution on signup, reward on first
      submission/vote (never on signup alone), leaderboard
- [ ] Notifications as a real in-app inbox (`readAt`-driven, `GET /notifications`) — still no
      push/SMS/email delivery channel, needs real FCM/Twilio/SES credentials
- [ ] Admin module: `ADMIN_PHONE_NUMBERS` allowlist guard, god-view, force-reveal a stuck round,
      manual submission elimination, KYB approve/reject, dispute resolution, growth dashboard
      (vote-deck completion rate, entries/campaign, brand repeat rate, time-to-first-payout,
      k-proxy — D1/D7/D30 explicitly flagged "needs a cohort table," not faked)

## Sprint 5 (lower priority — depth)

- [ ] Predictions (`Prediction` table exists, unused) — locked-until-close picks for non-entrants,
      scored into `tasteScore`
- [ ] Disputes — creator appeals an elimination, admin resolves
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
  commit leaves a round with no scheduled close/reveal job. The Sprint 4 admin god-view is meant to
  catch "stuck rounds" (past `closesAt`/`revealDeadlineAt` in the wrong status).
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
