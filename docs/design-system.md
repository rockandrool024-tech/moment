# MOMENT design system

The frontend build spec — grounded in the three reference images and cross-checked against what's
already implemented in `apps/web` (as of this doc, still uncommitted in the working tree: the
Sheet/Avatar components, tier tokens, `/map`). This is the single source of truth for "what should
this look like" going forward — screens should stop inventing one-off styling and pull from here.

## 0. What we're taking from each reference, and why

Don't chase all three literally — they pull in different directions (light social feed, light
enterprise-safety tool, dark 3D game-map). What they share is the actual target: **bold data,
avatar-as-identity, cards over tables, bottom sheets over full-page navigation, a map as a living
home surface, not a utility.** Concretely:

| Reference | What we take | What we skip |
|---|---|---|
| **Fitness/social app** (today feed, friend map, profile rings) | Big, confident numbers as the primary visual element (`82`, `5,012`); segmented pill tabs (`FOR YOU` / `FRIENDS`); rounded stat cards with a one-word verdict ("Solid," "Good"); avatar stacks for social proof | The workout-specific iconography, the exact card grid |
| **Safety/evacuation app** (hazard map, site sheet) | The bottom-sheet-as-detail-view pattern (tap a pin → sheet slides up with chips + a countdown + one big CTA); colored radius/status circles on a map | The literal hazard/evacuation domain, the enterprise-blue palette |
| **Zenly-style 3D map** | Dark "home base" map screen with extruded geometry, avatar bubbles as pins, lowercase bold city label, icon-only bottom actions | Full dark-mode across the whole app (see §1.1 — this stays map-only, deliberately) |

MOMENT already has the map (§0's Zenly column) and the sheet pattern (§0's safety-app column,
now generic via `Sheet.tsx`). What's still missing, from the fitness/social column, is the **big
confident number + verdict card** — no screen currently does this, and it's the biggest visual gap
against the references. See §3.6.

## 1. Foundations

### 1.1 Theme split — intentional, not a gap

The main app (`/challenges`, `/me`, `/wallet`, `/discovery`, forms) stays **light**, matching the
social-app and safety-app references. `/map` stays its own **dark, self-contained scene**, matching
the Zenly reference. Do not extend `/map`'s dark palette to the rest of the app, and do not add a
light mode to `/map` — each reference earns its treatment on the screen it actually matches. If a
future screen is genuinely map-adjacent (e.g. a live-event view), it can opt into the dark tokens
below; everything else uses the light ones.

### 1.2 Color tokens

Already in `globals.css` — extend, don't duplicate:

```css
:root {
  --fg: #1a1a1a;
  --bg: #ffffff;
  --muted: #6b6b6b;
  --border: #d9d9d9;
  --accent: #16643f;
  --accent-fg: #ffffff;
  --danger: #a6212e;
  --card-bg: #fafafa;

  --tier-0: #c9834b; /* bronze */
  --tier-1: #b9c2c9; /* silver */
  --tier-2: #e6b93c; /* gold */
  --tier-3: #7ee0c9; /* platinum */
  --rally: #ff6f91;  /* challenge/rally coral */
}
```

**Add** (referenced by components below, not yet declared anywhere):

```css
:root {
  /* Semantic status — separate from --accent/--tier/--rally, which are
     brand/identity colors, not state. Use these for verdicts, not decoration. */
  --status-good: #1f8a4c;
  --status-warn: #b9660f;
  --status-bad: var(--danger);

  /* Verdict-card tint backgrounds (§3.6) — a soft wash, not a solid fill,
     so the big number stays the loudest thing on the card. */
  --status-good-bg: #e8f5ec;
  --status-warn-bg: #faf1e2;
  --status-bad-bg: #fbe9ea;
}
```

`/map`'s dark tokens stay scoped inside `map.module.css` — they are not global variables, on
purpose (§1.1).

### 1.3 Typography scale

No formal scale exists today — `h1`/`h2` are set, everything else is ad hoc inline `fontSize`.
Add this scale to `globals.css` and use it everywhere instead of one-off `style={{ fontSize: ... }}`:

```css
:root {
  --text-display: 2rem;     /* the "82" / "$5,000" moment — one per screen, max */
  --text-title: 1.5rem;     /* h1 */
  --text-heading: 1.15rem;  /* h2 */
  --text-body: 1rem;
  --text-small: 0.9rem;     /* .muted today */
  --text-caption: 0.75rem;  /* badges, labels */
}
```

`--text-display` is the fitness-app reference's whole trick: one big, bold, unmissable number per
screen (the streak count, the prize pool, the wallet balance), everything else recedes. Don't put
two `--text-display` elements on the same screen — that's what breaks the "what am I supposed to
look at first" hierarchy the reference nails.

### 1.4 Spacing & radius

Already consistent in practice (`0.5rem`/`0.75rem`/`1rem`/`1.5rem` steps, `6px`/`8px`/`14px`/`16px`
radii) but never named. Formalize so new components don't invent a fifth radius value:

```css
:root {
  --radius-sm: 6px;   /* inputs, small buttons */
  --radius-md: 8px;   /* .card, .pair-option */
  --radius-lg: 14px;  /* .card-elevated */
  --radius-full: 999px; /* badges, pills, avatars */
}
```

### 1.5 Motion

Already established via `.sheet-rise` and `.card-interactive`'s hover-lift, both correctly guarded
by `prefers-reduced-motion`. The rule going forward: **any new animation reuses one of these two, or
gets added here as a third named pattern — never a bespoke one-off `@keyframes` inside a single
component's CSS module.** (`/map`'s pulse-ring is the one legitimate exception — it's specific to
the presence-ring visual, already shared via `Avatar.module.css`.)

## 2. Layout patterns

### 2.1 Bottom navigation (mobile) — not yet built

Every reference image uses a persistent bottom bar on mobile; MOMENT's nav is still a single top
bar at every width (it gained active-state highlighting, not a responsive layout change). Add a
`BottomNav` component, mounted only under the 480px breakpoint (`display: none` above it, so it
doesn't fight the existing top `.nav` on desktop):

- Items: Challenges, Map, Discover, Wallet, Me (same set as the top nav, same icons from
  `components/icons.tsx` — do not invent a second icon set for mobile)
- Active item styled the same way `/map`'s own `.navPillActive` already looks (filled pill, not
  just a color change) — reuse that visual language rather than a third nav treatment
- Fixed to the viewport bottom, safe-area-aware (`padding-bottom: env(safe-area-inset-bottom)`,
  already used in `map.module.css`'s `.bottomNav` — copy that pattern)

### 2.2 Segmented control — not yet built as a shared component

Discovery's "Top creators" / "Active brands" toggle and the login form's implicit two-step flow are
both candidates. Formalize the fitness-app reference's pill-tab pattern as a real component instead
of Discovery's current two independent `<button>`s:

```
[ Top creators | Active brands ]   ← single pill container, active segment gets --bg white + shadow
```

- Container: `background: var(--border)`, `border-radius: var(--radius-full)`, `padding: 3px`
- Active segment: `background: var(--card-bg)` (or white), `box-shadow: 0 1px 3px rgba(0,0,0,.08)`,
  full radius, no border
- Inactive segment: transparent, `color: var(--muted)`

## 3. Components

### 3.1 Card — already correct, keep using as-is

Three variants exist and cover every real case:
- `.card` — flat, bordered. Use for forms/groupings that shouldn't compete for attention.
- `.card-elevated` — shadowed. Use for anything that should read as a distinct, tappable object
  (list rows, PWA chrome).
- `.card-elevated.card-edged` (set `--edge-color` inline) + `.card-interactive` — for anything in a
  list that's both status-colored and clickable (challenge cards, wallet history rows).

Don't add a fourth card variant without a concrete reason — three already covers flat/raised/edged.

### 3.2 Badge — already correct

`.badge` (flat grey) for neutral metadata (challenge status, phase). `.badge.badge-tier` (set
`--tier-color` inline via `tierBadgeStyle()`) for anything tied to the tier/type color scale
(creator tier, payout type). Don't reach for inline-styled `<span>` pills anywhere — every status
chip in the app should be one of these two.

### 3.3 Avatar — already correct

`<Avatar userId size tier? cacheBust? />`. Pass `tier` to get the presence ring; omit it for
non-creator avatars (brands, generic references). This is the one and only avatar rendering path —
if a screen still hand-rolls an `<img src={avatarUrl(...)}>`, that's a bug, not a style choice.

### 3.4 Sheet — already correct, needs one addition

`<Sheet title onClose>{children}</Sheet>` is the standard bottom-sheet/detail-panel pattern, correct
per §0's safety-app reference. **Missing piece**: that reference's sheet has a persistent primary
CTA docked at the bottom (`Check-out`) separate from the scrollable content above it. Add an
optional `footer` prop:

```tsx
interface SheetProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode; // sticky CTA row, e.g. <button className="btn-block">Confirm</button>
}
```

Use this for the funding-confirmation sheet once it needs its own submit action, and for `/map`'s
pin sheet's "View profile" CTA instead of that CTA currently living inside the scrollable body.

### 3.5 Dropzone — already correct

The drag-and-drop video input built for `submit/page.tsx` (dashed border, `PlayIcon`, drag-state
highlight) is the standard file-input pattern now. Any future file upload (avatar upload, brand
logo, once those exist) reuses this exact markup/style, not a bare `<input type="file">`.

### 3.6 StatCard — new, not yet built

The single biggest missing piece from the fitness-app reference. A card whose entire purpose is one
big number plus a one-word verdict:

```tsx
interface StatCardProps {
  label: string;        // "Voting streak"
  value: string;        // "12" or "$5,000"
  verdict?: { text: string; tone: "good" | "warn" | "bad" };
  icon?: ReactNode;
}
```

- `value` renders at `var(--text-display)`, bold (800), `font-variant-numeric: tabular-nums`
- `verdict` (if present) renders as a small pill using `--status-{tone}-bg`/`--status-{tone}`
  (§1.2) — e.g. `{ text: "Solid", tone: "good" }`
- Layout: `.card-elevated`, icon top-left small, value large and centered-left, verdict pill
  top-right — matching the reference's `SLEEP 82 Solid` card almost exactly

**Where to use it**, replacing current plain-text stat lines:
- `/me` — voting streak (`value: streakCount`, `verdict: streakPausedReason ? "Paused" : "Active"`)
  and taste score
- `/wallet` — lifetime earnings (currently a plain `<p style={{fontSize:"2rem"}}>`  — promote to a
  real StatCard so it matches every other big-number moment in the app instead of being its own
  one-off inline style)
- Campaign analytics page — funnel counts per phase

### 3.7 Empty state — new, not yet built as a shared component

Every empty state in the app is still `<p className="muted">No X yet.</p>`. This is the largest
remaining content gap (flagged repeatedly in the UX audit) and it's a styling gap too — nothing
about it matches the polish level the rest of the app is reaching. Build one component:

```tsx
interface EmptyStateProps {
  icon: ReactNode;
  title: string;      // what's missing
  body: string;        // why, one sentence
  action?: { label: string; href: string };
}
```

Centered, generous vertical padding (`3rem 1.5rem`), icon at 32px in `--muted`, title at
`--text-heading`, body at `--text-small` `--muted`, action rendered as a `.btn` if present.

**Copy for each instance** (content, not just markup — this is what actually closes the audit
finding):

| Screen | Icon | Title | Body | Action |
|---|---|---|---|---|
| Challenges list (no data) | `PlayIcon` | "No live challenges right now" | "New ones show up here the moment a brand funds them — check back soon." | — |
| Wallet (no payouts) | `WalletIcon` | "Nothing earned yet" | "Enter a challenge to start building your wallet." | "Browse challenges" → `/challenges` |
| Rounds (no finalists) | `VoteCheckIcon` | "No finalists yet" | "They'll show up here once round 1 closes and the votes are tallied." | — |
| Discovery, brands tab | `PinIcon` | "No active campaigns" | "Brands show up here the moment they fund a live challenge." | — |
| Challenge detail (no rounds) | `PlayIcon` | "Round 1 hasn't opened" | "The brand opens it once the challenge is funded." | — |

## 4. Icons

`components/icons.tsx`'s existing 9-icon set (Flame, TierCrown, VoteCheck, Rally, Wallet, Pin,
Verified, Play, Compass, Share) covers everything currently rolled out. Two gaps for the components
above:

- **StatCard** needs small contextual icons per stat (a small flame for streak, a coin/star for
  taste score) — reuse `FlameIcon` for streak; taste score can reuse `TierCrownIcon` rather than
  adding a new glyph until there's a concrete reason to.
- **EmptyState** — no new icons needed, reuse the table in §3.7.

Do not add icons from an external set (Tabler, etc., as used in the `docs/mockup-*.html` throwaways)
— everything ships as inline SVG in `icons.tsx`, no font/CDN dependency, matching the decision
already made there.

## 5. Screen-by-screen build guide

Concrete instructions per screen — what to use from the sections above, in priority order.

1. **`/me`** — Replace the plain streak/taste-score `<p>` lines with two `StatCard`s (§3.6). Keep
   the existing Avatar/tier-badge/rally-link sections as-is, they're already correct.
2. **`/wallet`** — Promote the lifetime-earnings number to a `StatCard`. Replace the "No payouts
   yet." line with `EmptyState` (§3.7 table), action → `/challenges`.
3. **`/challenges`** (list) — Replace "No challenges yet." with `EmptyState`.
4. **`/challenges/[id]`** — Wrap the funding-confirmation `Sheet` to use the new `footer` prop
   (§3.4) for its submit action once that refactor happens. Replace "No rounds opened yet." with
   `EmptyState`.
5. **`/discovery`** — Replace the two independent tab buttons with the segmented control (§2.2).
   Replace both empty states with `EmptyState`.
6. **Bottom nav** (§2.1) — mount globally under 480px, alongside (not replacing) the existing top
   `.nav` on wider viewports.
7. **`/rounds/[id]`** (vote deck, public vote) — out of scope for this pass. This screen needs real
   submission media wired into the API response before any visual treatment matters (see
   `UX_EXPERIENCE_AUDIT.md` P0-1) — don't spend design time on card styling here until that's true,
   or the polish will be covering for missing content instead of presenting it.
8. **`/challenges/[id]/submit`** — Remove the leaked Mux debug string
   (`UX_EXPERIENCE_AUDIT.md` P0-3) and replace with plain-language copy: *"Upload didn't go through
   — try again in a moment."* No new component needed, this is a copy-only fix.
9. **Campaign analytics** (`/challenges/[id]/analytics`) — use `StatCard` for each funnel-stage
   count instead of a plain table, once that page gets a design pass.

## 6. Guardrails

- Don't give `/map` company — no other screen adopts its dark palette (§1.1).
- Don't invent a fourth card variant, a second icon set, or a bespoke animation — extend the three
  existing card variants, `icons.tsx`, and the two named motion patterns (§1.5) instead.
- Every empty state gets real copy from §3.7's table, not a placeholder — "No X yet." is exactly
  the pattern this system replaces.
- `StatCard`'s big number is a scarce resource — one per screen. If a screen seems to need two, that
  usually means the actual hierarchy question ("what should the user look at first") hasn't been
  answered yet.
