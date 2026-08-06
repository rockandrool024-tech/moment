# @moment/web

Next.js client for the MOMENT backend ([apps/api](../api)). Deliberately bare-bones UI — the
goal of this pass was exercising every Phase 1 backend capability end-to-end in a browser, not
visual design. See the root [README](../../README.md) for product scope and the api's
[README](../api/README.md) for backend design notes.

## Local development

```bash
cp apps/web/.env.example apps/web/.env.local
pnpm install
pnpm --filter @moment/web dev   # http://localhost:3001
```

Needs `apps/api` running (see its README) and `CORS_ORIGIN=http://localhost:3001` set on the API.

## Pages

| Route | What it does |
|---|---|
| `/login` | Phone OTP request/verify, role pick on first login |
| `/challenges` | Public list; "New challenge" for sellers |
| `/challenges/new` | Seller: create a challenge (draft) |
| `/challenges/[id]` | Brief, prize breakdown, Stripe Elements funding, rounds list, open-next-round |
| `/challenges/[id]/submit` | Creator: submit teaser/full-content + Mux video upload |
| `/rounds/[id]` | Peer-vote deck (rounds 1-2) or public finalist voting (round 3) |
| `/me` | Profile + Stripe Connect payout onboarding |

## Known rough edges (functional, not polished)

- No video playback in the vote-deck UI — pairs show a truncated submission id rather than the
  actual clip, since no endpoint currently exposes Mux playback IDs to the client. Wire that up
  before this is usable by real voters.
- JWT lives in `localStorage`, not an httpOnly cookie — fine for this pass, worth hardening
  before real users' sessions are on the line.
- No React Native/Expo app yet — mobile is a follow-up pass (README's "mobile-first" stack
  decision still stands; this is web catching up first).
