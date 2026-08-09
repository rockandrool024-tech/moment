# PEROKIO v2 branding — dev handoff

Everything below is ready to implement. It's organized so you can start at the top and not need
to come back to this conversation for context. Source-of-truth files are named explicitly —
don't re-derive colors/spacing from memory, read them from the file.

## 0. What's confirmed, what's still open

**Confirmed by the product owner:**
- New name: **PEROKIO**. Dark theme, app-wide (this supersedes MOMENT v1's rule of "light app,
  dark `/map` only" — that rule is dead, don't apply it).
- Palette direction: the dark neutral *structure* from the original brand spec, with the
  **sunset gradient** (`#F7FD04 → #F9B208 → #F98404 → #FC5404`) replacing purple as the
  primary/CTA/prize/highlight color. Tier and semantic colors are unchanged from the original spec.

**NOT yet confirmed — blocking before you touch the backend/schema:**
The brand voice examples in the original spec ("storyteller" not "seller," "tell this story" not
"submit an entry," "momentum score" not "vote") imply renaming the actual domain model —
`Challenge` → `Story`, the `seller` role, the vote/elimination mechanic's public framing — not
just new CSS classes. **Do not rename Prisma models, API routes, or TypeScript types based on
this document.** Every mockup in `docs/perokio/` uses "story"/"storyteller" only as *display
copy* layered over the existing `Challenge`/`Submission`/`seller` data model. If/when a real
domain rename is wanted, that's a separate, larger piece of work (migration, every controller,
every ADR) that needs its own scoping pass — flag it back rather than guessing.

## 1. Source files — read these, don't re-derive

| File | What it is |
|---|---|
| `docs/perokio/tokens.css` | The actual token file. Copy/adapt into `apps/web/src/app/globals.css` — see §2. |
| `docs/perokio-v2-mockup.html` | Logo (3 variants), color swatches, buttons, and the `/me` page with JourneyStepper, rendered. |
| `docs/perokio/component-library.html` | Cards, badges, form elements (incl. 3 Uiverse-derived expressive variants), segmented control, live motion (actually playing, not described), icon reference, and the `/results` outcome ticket. |
| `docs/design-system.md` | MOMENT v1's system. Superseded by the above for anything it conflicts with (theme split, palette) — still correct for things it doesn't touch (spacing scale numbers, the "one `--text-display` per screen" hierarchy rule, the three-card-variant discipline). |

## 2. Token migration — `globals.css` → PEROKIO

This is a **theme inversion, not a find-and-replace of variable names.** The old system was
light-on-dark-text; the new one is dark-on-light-text. Swapping var *names* without swapping
which token maps to background vs. foreground will produce a broken, half-inverted UI. Table
below is old token → new token, with the ones that need actual logic changes (not just renaming)
flagged.

| Old (`globals.css`) | New (`tokens.css`) | Note |
|---|---|---|
| `--bg: #fff` | `--bg-base: #0A0A0F` | Inversion — this is the page background now, near-black not white. |
| `--fg: #1a1a1a` | `--text-primary: #FAFAFA` | Inversion — near-white now. |
| `--card-bg: #fafafa` | `--bg-elevated: #18181B` | |
| `--muted: #6b6b6b` | `--text-secondary` *or* `--text-muted` | Old system had one muted tier, new has two. Use `--text-secondary` for body-adjacent secondary text, `--text-muted` for timestamps/captions/metadata. Use judgment per call site, don't blanket-replace. |
| `--border: #d9d9d9` | `--border-subtle: #27272A` | |
| `--accent: #16643f` | `--accent: var(--sunset-orange)` | Var name is unchanged on purpose — call sites using `var(--accent)` don't need to change, only the *definition* does. |
| `--accent-fg: #fff` | `--bg-base` | Inversion — old accent (dark green) needed white text; new accent (bright orange/gold) needs dark text. Every `color: var(--accent-fg)` call site needs to become `color: var(--bg-base)`, not just have its source var redefined. |
| `--danger: #a6212e` | `--error: #EF4444` | |
| `--tier-0..3` (`#c9834b`/`#b9c2c9`/`#e6b93c`/`#7ee0c9`) | `--tier-bronze`/`silver`/`gold`/`platinum` (`#CD7F32`/`#94A3B8`/`#FBBF24`/`#E2E8F0`) | Different hex values, not just renamed — same 4 tiers, new colors. |
| `--rally: #ff6f91` | **No direct equivalent defined.** | See callout below — this one needs a decision, not just a lookup. |

**`--rally` needs a decision before you migrate `/map`.** Eight live files currently reference
`var(--tier-N)` or `var(--rally)`: `NavBar.tsx`, `me/page.tsx`, `map/page.tsx`, `wallet/page.tsx`,
`challenges/page.tsx`, `discovery/page.tsx`, `tier.ts`, `globals.css`. `map/page.tsx` specifically
uses `--rally` as `CHALLENGE_COLOR` for challenge pins — if you drop the token without replacing
it, that component breaks (undefined CSS var → transparent/inherit, not a crash, but a silently
wrong pin color). Recommended: keep `--rally` defined in the new token file as an alias —
`--rally: var(--sunset-red);` — least-risk, keeps every existing call site working, costs nothing.

**Known footgun, don't repeat it:** a previous pass had a blanket `button, .btn { width: 100% }`
mobile rule that silently stretched `/map`'s small icon buttons to full width until it was caught
via computed-style inspection, not visually. It's since been narrowed to `.btn`/`.btn-block` only.
When you add new small buttons/icon-buttons under the new system, check computed width, not just
how it looks in whatever viewport you happen to be testing at.

## 3. Component migration

Existing shipped components (`Avatar.tsx`, `Sheet.tsx`, the three `.card` variants, `.badge`/
`.badge-tier`) keep their *structure* — same props, same class names, same mechanics. Only the
token values they reference change, which happens automatically once §2 is done, with one
exception: **`Sheet.module.css`** hardcodes light-theme values directly (`background: var(--bg)`,
border, shadow) rather than only using tokens — read it before assuming a token swap alone fixes
it, since some values there may need direct edits.

**New from `docs/perokio/component-library.html`, not yet real components:**

| Mockup class | Becomes | Notes |
|---|---|---|
| `.btn-ignite` | A `variant="ignite"` on the existing button styling, or a new `IgniteButton` | Secondary/confirm actions only — not the primary CTA button, see the file's own note on why. |
| `.cir-tabs*` | `SegmentedControl` component | Real radio+label markup, not a JS-driven fake — port the HTML structure as-is, it's already accessible (native keyboard/focus behavior). |
| `.brutal-switch` | An expressive `Switch` variant, alongside the existing quiet one | Both variants should exist side by side, not replace each other — see file for which contexts each fits. |
| `.tilt-field*` | An expressive input treatment for one-off "claim/confirm" moments | Not a replacement for the standard `.input` — same "quiet default + expressive variant" pattern as the switch. |
| `.tk-*` (outcome ticket) | New component for `/results/[submissionId]` | **Mobile gotcha, read before building:** the reveal is pure CSS `:hover`, and `/results` is server-rendered for OG-image link unfurls — a touch device never fires `:hover`. Needs a tap-to-reveal fallback (state-driven reveal on tap, or a `@media (hover: none)` variant that reveals after a short delay / on tap) before this ships, or mobile users just see a static "?" forever. |

## 4. `/me` — JourneyStepper

Already spec'd in full in an earlier pass of this conversation (not re-pasted here, ask if you
need the full spec restated): six milestones — Joined, Personalized avatar, Submitted first
entry, Advanced past round 1, Earned first payout, Reached Silver+ — each backed by a real field
(`User.createdAt`, `avatarGeneratedAt`, `Submission` existence, `Submission.status === "advanced"`
existence, `Payout` existence, `User.tier > 0`). Needs one new endpoint,
`GET /users/me/journey`, computed server-side (same pattern as the existing `/users/me/streak` /
`/users/me/rally-stats`), not client-aggregated from multiple list fetches. Rendered in the dark
system in `docs/perokio-v2-mockup.html` §04 — done/current/upcoming node states, tabular-nums gold
stat numbers.

## 5. Explicit non-goals for this pass

Not designed yet — don't invent these while implementing, come back for a design pass first:
- `/stories` feed + detail pages (Priority 2 in the original spec)
- Landing page (perokio.com)
- Admin god-view

## 6. Suggested order

1. §2's token migration in `globals.css` (unblocks everything downstream)
2. `--rally` decision, since `/map` is live and currently depends on it
3. Roll the migrated tokens through existing components (Avatar, Sheet, cards, badges) — should
   be near-mechanical once step 1 is done correctly
4. New components from §3, in the order they appear in `component-library.html`
5. `GET /users/me/journey` + wire `JourneyStepper` into `/me`
6. The outcome ticket for `/results` — build the touch fallback as part of this, not after
