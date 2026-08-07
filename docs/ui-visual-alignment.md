# UI visual alignment — bring the rest of the app up to `/map`

`/map` introduced a real design system (tier color scale, custom icon set, presence rings, elevated
cards, sheet motion) scoped to itself. Everything below is what it takes to extend that system to
the rest of `apps/web`, which is still on the original bare-bones palette. Grouped so foundation work
is done once, not five times.

## 0. Foundation — do this first, everything else depends on it

1. **Extract shared tokens.** The tier color scale (`#c9834b` bronze / `#b9c2c9` silver / `#e6b93c`
   gold / `#7ee0c9` platinum), the challenge/rally coral (`#ff6f91`), and the brand green currently
   only exist inline in `map/page.tsx` and `map.module.css`. Pull them into CSS custom properties in
   `globals.css` (`--tier-0` … `--tier-3`, `--rally`) so every screen references the same values
   instead of re-deriving them.
2. **Fix the global button rule that already bit the map once.** `globals.css`'s
   `@media (max-width:480px) { button, .btn { width:100% } }` silently stretched the map's pin
   buttons to full width until it was caught (fixed with an explicit `width` override). Scope that
   rule to an opt-in class (`.btn-block`) instead of every `<button>`, or the next small icon-button
   anywhere in the app hits the same bug.
3. **Promote the tier badge from a generic grey pill to the color scale.** `<span className="badge">`
   is used on `/me`, `/discovery`, and `/results` for tier — right now it's the same flat grey as
   every other badge in the app (challenge status, verification, etc.). Give it `--tier-N`
   background once (item 1), and every tier badge across the app upgrades for free.

## 1. Icon rollout (`components/icons.tsx` exists, used only on `/map` today)

| Where | Replace | With |
|---|---|---|
| `challenges/[id]/page.tsx` KYB banner | 🔒 emoji | `VerifiedIcon` |
| `me/page.tsx` streak line | 🔥 / ⏸️ emoji | `FlameIcon` |
| `submit/page.tsx` "Video ready ✓" | ✓ text | `VoteCheckIcon` |
| Video/thumbnail placeholders (submit, vote deck once media lands) | — | `PlayIcon` |
| Wallet header, tier badge label | — | `WalletIcon`, `TierCrownIcon` |
| "Copy link" / "Share your result" buttons | — | `ShareIcon` |
| Discovery brand rows | — | `PinIcon` (mirrors the map's challenge pins) |
| Rally link section on `/me` | — | `RallyIcon` |

## 2. Presence ring + avatar treatment

The pulsing tier-colored ring built for map pins (`.ring` / `@keyframes pulse` in
`map.module.css`) should wrap every avatar the app already renders via `avatarUrl()` — `/me`,
`/discovery` creator rows, `/results` — not just the map. Same visual language, same component,
reused rather than reinvented per screen.

## 3. Screen by screen

- **NavBar** — icons next to each label (the set already covers Map/Wallet); add active-route
  highlighting, which doesn't exist today.
- **Login** — a small branded header above the phone field; `VerifiedIcon` next to the "no
  passwords" trust line.
- **Challenges list** — swap the flat bordered card for an elevated card with a tier/status-colored
  left edge, matching the map plot's gradient treatment; `PlayIcon` placeholder where a thumbnail
  will eventually go.
- **Challenge funding screen** — the pricing breakdown (flagged P0 in the UX audit) is the right
  place to reuse the map's bottom-sheet component: one total number visible by default, itemization
  behind a "see breakdown" tap that opens the same sheet pattern already built and animated.
- **Submit entry** — replace the plain `<input type="file">` with a styled dashed-border dropzone +
  `PlayIcon`, matching `docs/mockup-09`'s upload card.
- **Vote deck** — once pair media exists (UX audit P0-1, unblocked separately), give the pair cards
  the same rounded/gradient card treatment as map plots, with `VoteCheckIcon` on the picked side.
- **Wallet** — `WalletIcon` header; payout-type rows get a small tier/type-colored chip instead of
  plain text.
- **Discovery** — creator rows get the presence ring (item 2); add a "View on map" link per row that
  deep-links to `/map` with that pin pre-selected — cheap cross-feature tie-in now that both exist.
- **Results / share card** — already the strongest screen in the app; just move its tier badge onto
  the shared color scale (item 0.3) so it's visually consistent with the rest, no other changes
  needed.
- **PWA install prompt / offline page** — restyle with the same elevated-card shadow used for the
  map's bottom sheet, so the app's "chrome" moments feel like one product.

## 4. Effects to standardize, not one-off

- The sheet "rise" entrance animation (`@keyframes rise` in `map.module.css`) should be the
  standard modal/bottom-sheet entrance everywhere a confirm step appears (funding confirm, rating
  form) — right now those just pop in with no motion.
- Hover state on interactive cards: map pins get a lift; `pair-option` in the vote deck currently
  only changes border color. Match them.
- `prefers-reduced-motion` is only guarded on the map's pulse ring today. Any new animation added
  under items 2–4 needs the same guard, not a one-off.

## Suggested order

Foundation (§0) unlocks everything else and is the smallest diff with the widest payoff — do it
before touching individual screens. After that, the icon rollout (§1) and presence ring (§2) are
pure additions with no layout risk. Screen-by-screen (§3) is where real design judgment is needed
per page; funding and vote-deck are the highest-impact per the UX audit, so do those two first if
sequencing one at a time.
