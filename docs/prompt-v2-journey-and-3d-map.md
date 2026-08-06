> ## ⚠ BACKLOG — NOT IN V1 SCOPE
>
> **v1 is locked as of 5 Aug 2026.** Nothing in this document is part of it. Do not build from this file.
>
> It is kept as the record of a v2 direction that was explored and set aside. The CPM payout model in particular was **rejected** — v1 pays a prize pool, not a rate per thousand views. See the root `README.md` for what is actually in scope.

# Guiding prompt — MOMENT v2: character-file journey, CPM payouts, 3D influence map

**Purpose:** paste the block below to an agent working in this repo to implement the v2 redesign.
**Date:** 4 Aug 2026
**Read first:** this redesign contradicts three shipped decisions. Section C of the prompt names them and forces a resolution rather than letting them be broken silently.

---

## THE PROMPT — copy from here

You are working in the `moment` project. Read `docs/` first, in this order: `ADR-001` (architecture), `ADR-003` (teaser peer-vote), `ADR-004` (discovery profiles), `ADR-005` (rally attribution and prize economics), `growth-viral-mechanics.md`, and `prototype-screen-index.md`. Then open `moment-prototype.html` to see the 37 screens as built.

Implement MOMENT v2. This is a version change, not a patch — the competition mechanic, the payout model, and the discovery surface all change.

### A. The new creator journey

Replace the current teaser → peer-vote → full-content → public-final funnel with this:

1. **Join.** Phone verification stays as-is.

2. **Create a character file.** A structured creator identity document: niche, tone, visual style, recurring formats, audience description, do-nots, sample work. This is a first-class persisted entity, editable, and it becomes the input to every AI generation the creator does. Treat it as the creator's most valuable asset in the product — it should feel like building a character sheet, not filling in a profile form.

3. **Browse scrollable story cards.** A vertical card deck of live brand briefs. Each card shows the brand, the CPM on offer, the budget ceiling, and a **"view assets"** affordance that expands the brand's supplied material (product shots, logos, guidelines, reference clips) inline.

4. **Join up to 5 cards.** A creator collects up to five active story cards. Five is a hard cap and should be visible and motivating — a slot UI, not an error message.

5. **Generate 5 teasers with AI.** For each joined card, the app generates a teaser from the character file plus that brand's assets and brief. The creator can regenerate and adjust, but the character file is what makes their five teasers look like *theirs* rather than generic output.

6. **Level 1 lock-in.** Submissions lock, data collection completes. Show the creator exactly what was captured and what happens next.

7. **Swipe voting.** A card-by-card like/dislike swipe deck over other creators' teasers. Fast, single-card, not side-by-side.

8. **End of round 1: 15 survive.** From the entrant pool, 15 advance. Everyone else is eliminated with a knockout card.

9. **Survivors post off-platform.** Each of the 15 creates their full creative and posts it to their own social channels, then drops the backlink into MOMENT.

10. **24-hour view window.** Views accrue against each backlink for 24 hours.

11. **CPM payout.** The brand sets a **price per 1,000 views** when creating the campaign. Each survivor earns `views ÷ 1000 × CPM`. Every survivor gets their own share — there is no single winner taking a fixed pool.

### B. Discovery becomes a 3D map — the core of the game

Replace the current three-tab discovery list with a 3D map as the app's centre of gravity. Reference aesthetic: **Zenly** — playful, rounded, saturated, tactile, readable at a glance, alive with motion. Not a data-viz map, not Google Maps.

The map displays:

- **Creators** as presences on the map, each with an **influence zone** — a soft radius that grows with the geographic distribution of their followers. A creator with 40k followers concentrated in Tunis has a dense, tight zone; one with the same count scattered globally has a wide, faint one.
- **Brands** as pins with a **growing zone** — their served or targeted market area.
- Together these render as a **heat map** of influence and demand.
- **Matching:** where a brand's growing zone overlaps a creator's influence zone, that's a fit signal. The map's job is to make that overlap legible instantly, so a brand can see its targeted market and who actually reaches it.
- **A dropdown parameter menu** for navigating and filtering the map: category, follower band, city, campaign status, and **competitors** — so a brand can see who else is buying attention in their zone, and a creator can see who they're up against locally.

Treat the map as the game board, not a directory. It should reward opening the app when nothing else is happening.

### C. Conflicts you must resolve, not ignore

These three contradict decisions already made and documented. Do not quietly overwrite them — resolve each explicitly in a new `ADR-006`, stating what changed and why.

**C1. Swipe like/dislike vs blind pairwise.** `ADR-003` chose blind *pairwise* comparison specifically as an anti-sabotage guardrail: a creator judging rivals can't target anyone when they only ever see two anonymised items side by side, and relative comparison is harder to game than absolute rating. Swiping is absolute rating, and it re-opens the sabotage vector. Either keep swipe and add a compensating control (normalise per-voter harshness, hide entrant status while voting, weight by taste score, seed calibration cards with known quality), or keep pairwise. State the choice and the mitigation.

**C2. Views decide money — which reverses ADR-005.** The product currently promises, in copy, on-screen: *"your followers can't buy you the win here."* Under CPM payouts that statement becomes false — reach converts directly to cash. The two-currency split was built precisely to prevent follower count from deciding money, and `growth-viral-mechanics.md` §2.3 argues that without it the best creator with 400 followers loses to a mediocre one with 40,000, and creator supply dies within weeks.

You must either:
- **(a)** keep the split's spirit by making *survival* (round 1) purely quality-judged and clearly framing round 2 as paid distribution rather than a contest — and rewrite every piece of copy that claims followers can't buy outcomes; or
- **(b)** accept follower bias and add a counterweight: CPM bands by follower tier, a per-creator earnings cap as a share of the campaign budget, or a separate small-account pool.

Whichever you choose, remove the now-false copy. A visible integrity promise the product no longer keeps is worse than never having made it.

**C3. Off-platform posting breaks the spectator loop.** Loops 4 and 5 in `growth-viral-mechanics.md` §3 depend on content living on MOMENT — the public battle page, the bracket, the no-login spectator feed. If the full creative lives on TikTok and Instagram instead, the app keeps the competition but loses the content that made it watchable, and the bracket has nothing to show in round 2. Decide what the spectator surface becomes: embedded posts, a live views leaderboard, a mirrored copy, or an accepted loss with the loop retired. Update §3 accordingly.

### D. Economics — CPM changes escrow

Escrow requires a known amount; CPM payouts are unbounded. Resolve as follows and reflect it in the funding screen:

- The brand funds a **budget ceiling** into escrow, not a prize pool.
- Earnings accrue at the stated CPM against that ceiling during the 24-hour window.
- Define and implement the behaviour when accrued earnings would exceed the ceiling: pro-rata scale-down across survivors at settlement is the fairest and the only one that can't be gamed by posting first. Do not use first-come-first-served.
- Unspent ceiling returns to the brand.
- Show the brand a live burn-down during the window, and show each creator their accrued earnings climbing — that counter is the strongest engagement surface in the whole 24 hours.
- Recompute platform take. `ADR-005` establishes 20% gross → **10.2% net**; the CPM model changes the shape of this and the new numbers must be worked out and written down, not assumed.
- `ADR-005`'s round-2 survivor bonus and finalist stipends were sized against a 32 → 12 → 4 funnel. With 15 survivors all earning on views, decide whether stipends still exist. Note that they were the mitigation for loser churn, and 15 of N survivors still leaves a large unpaid majority — do not delete them without a replacement.

### E. Feasibility constraints — check these before designing around them

- **Follower geography is not freely available.** Instagram Graph API audience insights require a Business or Creator account, a minimum follower threshold, and return *aggregated* city/country bands, not per-follower coordinates. TikTok's analytics API is similarly limited. Influence zones must therefore be built from coarse aggregates for *connected* accounts only, with a graceful representation for creators who haven't connected or don't qualify. Design for approximation, and never imply precision the data doesn't have.
- **Follower-location data is personal data in aggregate.** Rendering audience geography publicly needs a privacy review and a creator-facing opt-in. Do not ship influence zones as public-by-default without deciding this.
- **View counts must be verified, not self-reported.** Backlink clicks are not views. Pull view counts from platform APIs where available; where not, define the fallback and its fraud exposure explicitly. Paying real money against a number a creator can inflate is the single largest new fraud surface in v2 — velocity caps, view-source checks, and a hold period before payout are minimum controls.
- **3D map cost is real.** Recommend Mapbox GL JS (web) / `@rnmapbox/maps` (React Native) with extruded layers and a heatmap layer for zones, or deck.gl for the zone rendering. Budget for mobile performance work; a Zenly-grade map is weeks, not days, and it will be the most expensive single surface in the product.
- **AI-generated teasers homogenise.** If every teaser is model output from a template, round 1 judges prompt quality rather than creative quality, and the character file becomes the only differentiator. This also sits against the brief copy already in the product ("no studio lighting, no scripts, the version you'd post anyway"). Decide what round 1 is actually measuring and make the character file rich enough to carry it.

### F. Deliverables

1. `docs/ADR-006-v2-journey-and-cpm-payouts.md` — the new funnel, the C1–C3 resolutions, the CPM/escrow model, and revised economics with worked numbers.
2. `docs/ADR-007-influence-map.md` — map architecture, influence-zone computation from coarse audience data, privacy posture, matching logic, and the dropdown parameter model.
3. `moment-prototype.html` updated — character file builder, story card deck with view-assets, 5-slot join UI, AI teaser generation, swipe voting, lock-in, backlink drop, live views/earnings counter, settlement, and the 3D map discovery screen. Retire or rework screens the new funnel obsoletes; keep the screen index accurate.
4. `docs/prototype-screen-index.md` updated to match.
5. `docs/growth-viral-mechanics.md` updated — §2.3, §3, and §11 all change under CPM.

### G. Working constraints

- Write everything into the `moment` folder. Never leave deliverables in a temp directory.
- Match existing conventions: ADRs as `ADR-00N-*.md` with status, context, decision, trade-offs, consequences, action items. Prototype stays a single self-contained HTML file, dark theme, existing tokens, Tabler outline icons.
- Keep contrast at AA. Verify with a contrast check, don't eyeball it.
- Verify before claiming done: every screen renders, no `undefined` in output, the CPM and escrow arithmetic reproduces, and the screen count matches the index.
- Where a decision is genuinely open, show both options in the prototype and mark it open in the docs. Do not bury a guess.
- The sweepstakes legal question in `growth-viral-mechanics.md` §8 is still unresolved and still blocking. Note that paying a published CPM for delivered views is likely a *weaker* sweepstakes exposure than awarding a prize by vote, since it reads as a services/performance arrangement rather than a contest — flag this as a question for counsel, favourably, but do not treat it as settled.

## END OF PROMPT

---

## Notes for mortadha, not part of the prompt

**The biggest thing to decide before anyone builds:** C2. Views deciding money is a genuine strategic reversal, not a feature addition. The current design's whole integrity story — and a marketing asset you can say out loud — is that reach can't buy the outcome. CPM payouts make reach *the* outcome. That may well be the right call: it makes the value to brands legible, it moves you from "contest" to "performance marketplace," and it probably reduces legal exposure. But it changes who your product is for. A creator with 2,000 engaged followers can win a vote; they cannot out-earn a creator with 200,000 on a CPM. Round 1 becomes the only place small creators can compete, and they'll notice quickly that surviving to round 2 is a consolation prize.

If you want both, option (a) in C2 is the honest version: round 1 is the contest, round 2 is paid distribution, and you say so plainly rather than implying a level playing field in round 2.

**The 3D map is the most expensive thing in this document** and the influence zones depend on audience data you may not be able to get for most creators. Consider building the map first as a 2D Zenly-styled layer with coarse city-level zones, prove people open it, then invest in 3D.
