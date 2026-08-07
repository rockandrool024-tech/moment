# @moment/web

Next.js client for the MOMENT backend ([apps/api](../api)). Deliberately bare-bones UI — the
goal so far has been exercising every backend capability end-to-end in a browser, not visual
design. See the root [README](../../README.md) for product scope, [/TODO.md](../../TODO.md) for
what's built vs. still open, and the api's [README](../api/README.md) for backend design notes.

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
| `/login` | Phone OTP request/verify, role pick on first login, honors `?returnTo=` |
| `/challenges` | Public list; "New challenge" for sellers |
| `/challenges/new` | Seller: create a challenge (draft) |
| `/challenges/[id]` | Brief, prize breakdown (incl. survivor-bonus/crowd-favourite preview), KYB gate, Stripe Elements funding, rounds list, open-next-round, post-resolution ratings + brand trust stats |
| `/challenges/[id]/submit` | Creator: submit teaser/full-content + Mux video upload |
| `/rounds/[id]` | Peer-vote deck (rounds 1-2) or public finalist voting (round 3); captures rally attribution on vote |
| `/me` | Profile, rally link + stats, Stripe Connect payout onboarding |
| `/wallet` | Payout history, lifetime earnings, pending vs. paid |
| `/v/[code]` | Rally-link redirect to whatever battle that creator currently has live |
| `/battle/[challengeId]` | Public, no-login SSR spectator page + Open Graph share image |
| `/results/[submissionId]` | Public share-card page (advanced/knockout/winner tones) + OG image; shows a live vote count and "Vote for me" CTA while public voting is still open |

## Known rough edges (functional, not polished)

- No video playback in the vote-deck UI — pairs show a truncated submission id rather than the
  actual clip, since no endpoint currently exposes Mux playback IDs to the client.
- JWT lives in `localStorage`, not an httpOnly cookie — fine for now, worth hardening before real
  users' sessions are on the line.
- No responsive/mobile pass yet — the vote-deck `.pair-row` is still side-by-side at all
  viewport widths; PWA manifest/service worker not built yet (Sprint 2).
- No React Native/Expo app — the mobile plan changed to "make this a responsive, installable PWA"
  rather than a separate native client (see [/TODO.md](../../TODO.md)).
