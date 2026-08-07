# MOMENT — UX & Product Experience Audit

**Auditor:** AI Product Design / UX Supervisor (adversarial, user-side review)
**Date:** 2026-08-07
**Scope:** `apps/web` (Next.js 14 client) as experienced by a first-time creator, brand, and public spectator. Cross-referenced against `apps/api` for what data is actually available to render, and against `docs/moment-prototype.html` + `docs/mockup-*.html` (the existing 37-screen design mockups) for what was already designed but not shipped.
**Method:** Not a code-only read. I brought the stack up for real — `docker compose up` (Postgres + Redis), `nest start:dev`, `next dev` — and clicked through every reachable screen in a live browser session. Twilio isn't configured (per `.env`, expected at this stage), so I couldn't complete real OTP login; I minted a JWT locally with the project's own `JWT_SECRET` against the one seed user in the dev database ("Ana," creator role) to reach the authenticated screens the same way a logged-in user would. Every finding below is either something I saw render on screen or a specific line of source I read to confirm it.

---

## 0. Context this audit doesn't ignore

`apps/web/package.json` says outright: *"Bare-bones UI; design comes later."* `globals.css` opens with *"Deliberately minimal — functionality over polish this pass."* `TODO.md` lists a PWA/responsive pass as still-open Sprint 2 work. This is a spine build, on purpose, and I'm not treating "it looks plain" as a discovery — that part was already known and planned for.

What follows instead focuses on things a visual reskin *won't* fix on its own: broken or missing information in the core interaction, sequencing that will confuse a first-time user regardless of paint, and copy that leaks internal implementation detail to real people. Polish items are included too, tagged P2/P3, but they're not what's driving the score down.

The most important thing I found: **the app already has a real, considered visual/interaction design.** It's sitting in `docs/moment-prototype.html` and nine `docs/mockup-*.html` files — 37 screens, wired states, an explicit rationale for every mechanic. `apps/web` was not built from it. Section 5 covers this in detail; it changes the recommendation for almost everything below from "design something" to "implement what's already been designed."

---

## 1. Biggest UX Problems (ranked)

### 🔴 P0-1 — The core interaction shows no content to judge
The entire product is built around one action: watch two pieces of creator content and pick the better one. The live vote deck (`apps/web/src/components/VoteDeck.tsx:84-89`) renders this as two bare text labels:

```
Submission a3f9c210        Submission 7e1bb402
```

No video, no thumbnail, no caption, no creator name. Same problem in the final public vote (`apps/web/src/app/rounds/[id]/page.tsx:88-98`): `Submission {f.id.slice(0, 8)}` with a plain "Vote" button. This isn't a styling gap — the `Deck`/`Pair` API contract (`apps/web/src/lib/types.ts:84-97`) only ever returns submission **IDs**, never a video ref, thumbnail, or caption, so the frontend has nothing to render even if someone added a `<video>` tag today. A voter is being asked to make a blind judgment call with zero information to judge on. This is the single highest-leverage fix in the whole app — nothing else in this report matters if this doesn't get fixed.

*The irony: `docs/mockup-09-round1-teaser-peer-vote.html` already designed this correctly* — thumbnail-with-play-icon cards, a "vote 3 more to unlock your result" progress bar, "You won't see who made these" reassurance copy. That screen exists and was never wired up.

### 🔴 P0-2 — Money-critical screens read as a jargon dump
The moment a brand is about to fund a challenge — the single highest-trust, highest-stakes screen for that user type — they're shown, with no explanation of any term: *Pool*, *Stipend pool*, *Round-2 survivor bonus pool*, *Crowd favourite*, *Take rate (bps → %)*, then a "Confirm funding" step that crams four dollar figures into one run-on sentence (`apps/web/src/app/challenges/[id]/page.tsx:181-187`). Nothing tells a first-time brand what escrow means, why there are four payout types, or what they're actually agreeing to before they see a Stripe form. This is exactly the screen where trust needs to be *earned*, and instead it's the screen most likely to make someone bail.

### 🔴 P0-3 — An internal debug message ships as user-facing copy
`apps/web/src/app/challenges/[id]/submit/page.tsx:96-98`, shown to a real creator right after they submit an entry and attach video:

> "Video upload/processing failed — this is expected without a real MUX_TOKEN_ID / MUX_TOKEN_SECRET configured on the API."

That's a note to a developer, not a person. If Mux isn't configured in production the same way, this is what a creator sees after doing the one thing the whole funnel exists to get them to do.

### 🟠 P1-1 — Rally/referral links are raw database IDs
`/v/cmsi2tx040000kqw8kvlgcm1g`. This is the entire growth loop's shareable unit (`apps/web/src/app/me/page.tsx:119`, `docs/growth-viral-mechanics.md`'s whole premise) and it's a 25-character CUID. Nobody puts that in a TikTok bio or an Instagram Story sticker. The growth mechanic is well-designed underneath (stable per-creator link, rally XP, two-currency split) — it's undercut by the one thing that has to be typeable and shareable being neither.

### 🟠 P1-2 — First five seconds show nothing
`/` is a client redirect that renders `<p className="muted">Loading…</p>` before sending an unauthenticated visitor to `/login`, which is a bare `<h1>Log in</h1>` and a phone field — no logo mark beyond the nav text, no one-line explanation of what MOMENT is, no stakes shown. A stranger who lands here has no way to know this is "creators compete for real cash prizes, you get to vote" before being asked for their phone number.

### 🟠 P1-3 — The one seeded user's own display name never appears on their own profile
`Ana` shows up correctly on `/discovery` (`displayName ?? "Unnamed creator"`), but `/me` (`apps/web/src/app/me/page.tsx:85`) never renders `user.displayName` at all — only phone number, role, verification flag, tier, taste score, and a raw referral code. A creator's own profile page leads with their phone number as the primary identity element and omits their name. That's not a design-taste note, it's a rendering gap against data the API already returns.

### 🟠 P1-4 — Every empty state is one line of grey text with no next step
`"No challenges yet."` / `"No payouts yet."` / `"No rounds opened yet."` / `"No finalists yet."` / `"No active campaigns right now."` — five different screens, same pattern: state the absence, offer nothing. None say *why* it's empty or what to do about it. A brand landing on an empty challenges list with no CTA visible unless they already have the `seller`/`both` role has no idea a "New challenge" button exists conditionally elsewhere.

### 🟡 P1-5 — Gamification exists with no visible rules
Tier badge ("Bronze"), taste score ("0"), voting streak — all rendered as bare labels with zero explanation anywhere in the UI of what they mean, how to progress, or what changes at Silver/Gold/Platinum. `docs/mockup-04` (screen 20, "Tiers · functional not cosmetic") explicitly designed tiers to unlock real things and says so on-screen; the shipped version is a static pill with no tooltip, no progress bar, no "what's next."

### 🟡 P1-6 — Login's role picker is sequenced to cause mistakes
The "I am a… (only matters on first login)" role selector (creator / brand / both) appears on the **second** screen — after phone entry, once the OTP code has already been sent — not on the first screen where the user is deciding whether to even proceed. A first-time brand rep who doesn't notice the dropdown defaults to "Creator" and won't easily learn that role is fixed after first login.

### 🟢 P2-1 — "AI-generated placeholder" avatar is a deterministic identicon, not AI
`apps/api/src/modules/identity/avatar-generator.ts` is honest in its own code comments — it's a seeded 6×6 mirrored-grid identicon, explicitly a stand-in until a real image-gen provider is wired up. But the UI copy on `/me` says *"AI-generated placeholder"* to the user. Calling a hash-pattern square an AI generation is a small credibility ding the moment a user looks closely — and on a product whose creators live and die by visual identity, the default face they get looks like a broken avatar, not a placeholder with personality.

---

## 2. Screen-by-screen

Each screen evaluated as a first-time user experiencing it cold, live, in the running app (or via full source read where noted).

### Home (`/`)
- **User goal:** Land somewhere that tells me what this is.
- **Current experience:** Blank page, "Loading…" in grey, then an instant redirect to `/login` (or `/challenges` if already authenticated).
- **Problems:** No content ever actually renders here — it's a pure routing shim wearing a URL.
- **Emotion:** Neutral-to-confused; nothing to react to.
- **Opportunity:** This is the one guaranteed page every cold visitor hits before anything else. It's currently worth zero.
- **Recommended change:** Either skip the redirect flash (route server-side) or use it — a one-line value prop and a live stat (e.g. "$X in prizes paid out this week") while the redirect resolves.
- **Priority:** P1

### Login (`/login`)
- **User goal:** Get in with minimal friction.
- **Current experience:** Phone field → OTP code field → role dropdown appears *after* code is already sent.
- **Problems:** No context before the ask ("what is this, why give you my number"); role choice mis-sequenced (P1-6 above); "only matters on first login" is an implementation detail leaking into user-facing copy.
- **Emotion:** Slightly wary (no explanation before phone request) then mildly confused (unexpected role picker).
- **Friction:** A brand rep who fat-fingers past the role dropdown gets stuck as a "creator" account.
- **Opportunity:** Ask role *before* phone (it changes nothing about the OTP flow), and add one sentence of context above the phone field.
- **Recommended change:** Move role selection to step 1; add a one-line "why phone" trust note (no passwords, per ADR-001 — say that to the user, not just in the code comment).
- **Priority:** P1

### Challenges list (`/challenges`)
- **User goal:** See what's live, decide whether to enter or fund.
- **Current experience:** Live-tested: empty database renders "No challenges yet." with nothing else. Owner-only "New challenge" link appears top-right, invisible to creators.
- **Problems:** Empty state has no explanation or CTA for a non-brand visitor; card list (when populated) shows only title/status/prize pool — no thumbnail, no deadline urgency, no entrant count.
- **Emotion:** "Is this thing dead?" — an empty list with no framing reads as an abandoned product, not a pre-launch one.
- **Opportunity:** This is a marketplace; marketplaces live or die on "there's stuff happening here." Even pre-launch, show something (upcoming challenges, a waitlist CTA, a "how it works" strip).
- **Recommended change:** Empty state should answer what/why/next, per the same standard the rest of this report holds every empty state to.
- **Priority:** P1

### Challenge detail — funding flow (`/challenges/[id]`)
Covered in depth at P0-2. Also: `openNextRound`'s client-side eligibility guess (`canOpenNextRound`) is a reasonable UX affordance (`apps/web/src/app/challenges/[id]/page.tsx:131-135`) — good instinct to gate the button optimistically while still letting the server be the real authority — but when the guess is wrong, the user just sees whatever raw error string the API returns, with no interpretation.
- **Priority:** P0 (funding jargon), P2 (error interpretation)

### Submit entry (`/challenges/[id]/submit`)
- **User goal:** Get my video in before the deadline.
- **Current experience:** A form: phase dropdown, duration number field, caption text, file picker. No camera capture, no in-app trim/preview, no thumbnail shown after selecting a file.
- **Problems:** The leaked Mux debug message (P0-3). No indication of the round-1 duration limit *before* picking a file (the challenge's own `checklistCriteria.maxDurationSeconds` exists in the data model but isn't shown here). No upload progress bar — just three text states (uploading/processing/ready).
- **Emotion:** Uncertain whether the upload is actually working; no visual confirmation.
- **Opportunity:** This is the funnel's single point of highest intent — someone who got this far wants to enter. Every bit of friction here has outsized cost.
- **Recommended change:** Show the challenge's own duration/hashtag rules inline before the file picker; real progress bar; user-facing error copy for the video pipeline.
- **Priority:** P1

### Vote deck (`/rounds/[id]` → `VoteDeck`)
Covered in depth at P0-1 — this is the report's top finding. Worth noting what *is* well-built underneath: the 3-second minimum view timer and repeat-pair attention check (`MIN_VIEW_MS`, `checkPairIndex` in `apps/web/src/components/VoteDeck.tsx`) are a genuinely smart anti-low-effort-voting mechanic, uncommon to see this early in a build. The mechanic is sound; it's rendering into a void.
- **Priority:** P0

### Public final vote (`/rounds/[id]` → `PublicVote`)
Same missing-media problem as the deck, plus: finalists are listed with no ranking/context, and a voter who's already picked sees their own choice re-render mid-list with a "your vote" badge rather than any acknowledgment moment (no confirmation state, no thank-you, no "come back when it closes").
- **Priority:** P0

### Wallet (`/wallet`)
- **User goal:** See what I've earned, get paid.
- **Current experience:** Live-tested, empty state: "$0.00 lifetime earnings," "$0.00 paid out," "$0.00 pending transfer," "No payouts yet." The pending-transfer explainer copy is actually good — *"shown as earned the moment it's won, even before Stripe settles it"* is honest, clear, sets the right expectation.
- **Problems:** Nothing tells a brand-new creator *how* to earn their first dollar from this screen — no "enter a challenge to start earning" CTA. Also observed (network log): `/users/me` and `/users/me/wallet` both fire twice on a single page load — not user-visible, but signals the data layer hasn't been reviewed for redundant fetches.
- **Recommended change:** Empty wallet should link straight to `/challenges`.
- **Priority:** P2

### Profile / Me (`/me`)
Covered at P1-3 (missing display name) and P2-1 (avatar honesty). Also good: the rally-link explainer paragraph is genuinely well-written, human copy — *"Share this — it always points at whatever battle you currently have live... they never decide the prize"* — this is the tone the rest of the app should be written in.
- **Priority:** P1

### Discovery (`/discovery`)
- **User goal:** Browse who's winning / who's running challenges, without logging in.
- **Current experience:** Live-tested, no-login: two tabs, "Top creators" showed the one seed user with avatar, tier badge, win count; "Active brands" showed "No active campaigns right now."
- **Problems:** No sort/filter explanation (how is "top" determined?); brand tab's empty copy doesn't match the creator tab's ("No creators yet." vs "No active campaigns right now." — inconsistent voice for the same kind of empty state).
- **Opportunity:** This is the correct "come in without an account" surface for a Gen-Z audience — the structural instinct (build public, no-login browsing) is right. It just needs the same content-richness fix as everything else: real thumbnails/video, not text rows.
- **Priority:** P2

### Battle — public spectator page (`/battle/[challengeId]`)
Server-rendered, no-login, unfurls with real OG metadata — structurally this is the right call for shareability (ADR-002 calls it "the highest-leverage decision... for actual virality," and the code backs that up). Live tally shown when visible, blind-voting framed honestly when not. The one gap: like everywhere else, no video/thumbnail for what's actually being voted on — a spectator sees prize pool and status but never sees the content driving the competition.
- **Priority:** P1

### Results / share card (`/results/[submissionId]`)
This is the best-designed screen in the app. Dynamic headline/tagline by outcome (`outcomeTone`), a live vote counter styled with real visual weight (`fontSize: "2.5rem", fontWeight: 800`), a "Vote for me" CTA that re-enters the battle page with the creator's own rally code attached. The mechanics of a shareable win/loss/pending card are genuinely thought through end to end, including the OG image generation for link unfurls. Bring the rest of the app up to this bar rather than redesigning this screen.
- **Priority:** — (reference standard, not a fix target)

### Rally redirect (`/v/[code]`)
Clean, correct implementation — server-side resolve-and-redirect with a proper 404 on an invalid code. The only issue is upstream: the code itself is unshareable (P1-1).
- **Priority:** P1 (inherited from P1-1)

### PWA install prompt
Well-designed trigger logic — waits for a genuine second visit before prompting rather than the browser's naive first-load default, respects a dismissal flag (`apps/web/src/components/PwaInstallPrompt.tsx`). Copy is clear: *"Install MOMENT for quicker access to votes and payouts."* No changes needed.
- **Priority:** —

---

## 3. User Journey Score

| Stage | Score /10 | Why |
|---|---|---|
| First impression | 2 | Blank loading screen, then a bare form with no value proposition stated anywhere |
| Value proposition | 3 | Never explicitly stated in the UI — a visitor has to already know what MOMENT is |
| Signup / onboarding | 4 | Phone-OTP is the right low-friction *shape*; sequencing (P1-6) and missing context undercut it |
| First value (first vote) | 1 | The first real interaction a new voter has shows no content to evaluate |
| Core workflow (voting) | 1 | Same root cause — functionally incomplete as a media-judging task |
| Feedback / reward | 3 | Streak, tier, taste score, rally XP all exist server-side; none are explained or celebrated client-side |
| Navigation | 5 | Simple and predictable; no active-route highlighting, no mobile-specific nav pattern |
| Mobile experience | 5 | Real technical care already in `globals.css` (480px stacking, 48–52px touch targets) — but structurally still a shrunk desktop layout, not a designed mobile-first flow |
| Trust | 4 | The financial model is transparent in the *data* (pool/stipend/take-rate all real, escrow is real) but presented as unexplained jargon at the exact moment trust matters most |
| Conversion (brand funding) | 3 | KYB gate and Stripe flow are correctly modeled; the funding screen itself is a comprehension spike |
| Retention | 3 | Streak + tier are the right shape for a habit loop; neither is surfaced compellingly enough to pull someone back tomorrow |
| **Overall** | **3.1 / 10** | Reflects a real, correctly-modeled product with a visual/informational layer that hasn't caught up to the backend yet |

---

## 4. Engagement & retention loop

**What's already built, server-side, that the UI doesn't use:**
- Voting streaks (`streak.service.ts`, `streakCount`, pause-not-break semantics) — a genuine daily-return mechanic, currently surfaced only as plain grey text on `/me`.
- Tiers (`tier.ts`, `computeTier`) — currently a static badge with no visible rule.
- Rally XP + voter count (`RallyStats`) — currently two numbers in a sentence, no visual reward moment.
- Taste score — currently just a number with no explanation of what it's for or how it changes.

**Trigger → Action → Reward → Progress → Return**, as designed vs. as shipped:

| Stage | Designed for (server model) | What ships today |
|---|---|---|
| Trigger | Rally link, share card, streak reminder | Only the share card actually creates a return trigger today |
| Action | Vote on a deck / enter a challenge | Voting has no content to act on (P0-1) |
| Reward | Rally XP, streak continuation, tier progress | None of these produce any on-screen feedback moment — no toast, no animation, no "+1 day" |
| Progress | Tier thresholds, taste score growth | Numbers change; nothing communicates that a number changing *means* something |
| Return | Streak-preservation anxiety, "your battle is still live" | Present in concept (rally link "always points at whatever battle you currently have live" — good copy), absent in any notification/reminder surface (TODO.md confirms: no push/SMS/email delivery yet, by design) |

The loop is architecturally sound and the hard part (the data model) is done. What's missing is the reason it doesn't yet *feel* like a loop: no screen currently tells a user "you did a thing, here's what changed, here's what's next."

---

## 5. What's already been designed and not shipped

`docs/moment-prototype.html` (37 screens, wired states) and nine `docs/mockup-*.html` files are a complete, considered mobile visual language: a warm paper surface (`#f7f6f2`), a restrained accent-blue for primary actions, semantic success/warning/danger colors, Tabler iconography, real device-frame mockups. They solve, on paper, several of this report's findings directly:

- **The exact vote-deck problem (P0-1):** `mockup-09` shows video-thumbnail cards with play-icon overlays, a progress bar ("vote 3 more to unlock your result"), and reassurance copy ("You won't see who made these") — none of which exists in the shipped `VoteDeck.tsx`.
- **The funding jargon problem (P0-2):** `mockup-01` shows the four payout tiers as small color-coded stat cards (prize in blue, stipend in amber) with a checklist rendered as actual checkmarks, not a raw JSON-shaped criteria dump.
- **The unexplained-tiers problem (P1-5):** mockup screen 20 is explicitly titled "Tiers · functional not cosmetic," designed to show what a tier unlocks.

This matters for scoping: the visual-direction work in this report is not "invent a Gen-Z aesthetic from scratch." It's "wire the frontend to the design that's already been commissioned and sitting in `docs/` since before this build started." That's a materially smaller lift than a from-scratch design pass, and it should be the starting point before anyone opens a design tool.

---

## 6. Mobile strategy

What's already correct: the 480px breakpoint stacks `.pair-row` vertically and grows every button to a 48–52px minimum touch target (`globals.css:154-172`) — a real, deliberate mobile pass, done properly at the CSS layer.

What's missing:
- No mobile-specific navigation pattern — the same top nav bar ships at every width; a bottom tab bar (Challenges / Discover / Vote / Wallet / Me) would fit this product's five-screen core loop far better on a phone, and is the pattern every reference app in this category (TikTok, BeReal, Locket) uses for exactly this reason.
- `copyRallyLink` uses `navigator.clipboard.writeText` only — no `navigator.share()` fallback, which on mobile is the difference between "copy a link and go find an app to paste it into" and "one tap into the native share sheet." For a growth mechanic that depends entirely on sharing, this is a meaningful gap.
- No skeleton loading states anywhere — every async screen shows literal `"Loading…"` text, which reads noticeably worse on mobile's slower average connection and higher perceived-latency sensitivity.

---

## 7. Conversion strategy

- **Brand funding:** progressive-disclose the pricing breakdown. Lead with one number ("Total charge: $X") and put the pool/stipend/survivor-bonus/take-rate itemization behind a "see the breakdown" toggle — the itemization is good and should stay available, just not be the first thing a brand reads.
- **KYB gate:** currently a single line ("🔒 KYB verification required...") with a "Request verification" button and no indication of what happens next (how long, what's reviewed). Set expectations inline.
- **First-charge sticker shock:** the Stripe charge total (pool + stipend + survivor bonus + platform fee) is only computed and shown *after* a brand clicks "Fund escrow" on the challenge-creation flow, not during challenge creation itself. Show the full total earlier, at the point where the brand is still deciding on a prize amount.
- **Trust signals:** `TrustStatsMini` (brand payout history, on-time rate) is real and well-modeled but only rendered after a challenge resolves — a brand's *own* trust stats could reasonably be shown to them earlier as a confidence signal, and a brand's trust stats could be shown to creators *before* they submit, not just after.

---

## 8. Visual direction

Don't start from a blank page — start from `docs/moment-prototype.html` (see Section 5). The direction it already commits to (warm paper surfaces, restrained accent-blue, semantic color for money/status, real iconography, checklist-as-checkmarks) is a legitimate, non-generic Gen-Z-adjacent visual language, and it's already been thought through screen-by-screen. The job is implementation fidelity, not invention.

Two things to preserve and extend from what's *already shipped*, even in the bare-bones build: `globals.css`'s money is stored honestly (cents, `formatCents`), and the copy voice on the results/rally screens (see Results page review, Section 2) is genuinely good — human, confident, specific. That voice should be the template applied to every other screen's copy, not just the growth-loop ones.

---

## 9. Top 5 changes to make first

1. **Give the vote deck (and public vote) something to show.** Extend the deck/pair API to return a thumbnail URL, caption, and (post-reveal) creator identity per submission; render an actual video/thumbnail in `VoteDeck.tsx` and `PublicVote`. This single change unblocks the entire core loop.
2. **Replace raw CUID rally/referral codes with a short, human-typeable code** (6-char alphanumeric slug) — everywhere one is generated, stored, and displayed.
3. **Give `/` and `/login` an actual first impression** — a one-line value prop, real branding, before the phone-number ask; move the role picker to before phone entry.
4. **Rewrite every empty state and the leaked Mux debug string** to follow what/why/next — this is a copy-only, low-risk, high-visibility fix across five-plus screens in an afternoon.
5. **Progressive-disclose the funding breakdown** on the challenge-detail page: one total number up front, itemization behind a toggle, plus a one-line plain-English "what escrow means" note.

---

## 10. Overall UX Score: 29 / 100

This is a score for *the experience a real user would have today*, not a verdict on the team or the plan. The backend is unusually well-modeled for this stage (two-currency vote split, honest cents-based money, a real anti-low-effort-voting mechanic, a legitimately clever growth-loop data model) and a complete visual design system already exists on disk. The gap between "engineering spine" and "shippable product" here is real but it's a wiring problem, not a from-scratch design problem — which is a materially better position than the raw score suggests in isolation.

**Score breakdown:** first impression + value prop pull the floor down hard (P0-1 alone caps the core-loop ceiling at near-zero until fixed); trust/conversion sit in the middle, held back by unexplained jargon at money moments rather than by anything structurally wrong; the retention primitives (streak/tier/rally) are architecturally sound and would meaningfully lift this score the moment they're given any on-screen presence at all.
