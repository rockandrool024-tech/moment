# Perokio showroom — route coverage

## Purpose

The current showroom contains 37 core product screens, but the production frontend exposes 24 concrete Next.js routes. This matrix maps each route to an existing prototype screen and identifies the surfaces that need to be added so the showroom represents the complete product rather than only the core viral flow.

## Coverage matrix

| Production route | Existing showroom mapping | Status | Required addition |
|---|---|---|---|
| `/` | Splash · role pick | Partial | Add the final public landing state with brand voice, language switcher and CTA hierarchy. |
| `/login` | Verify · one human one vote | Partial | Add the full OTP onboarding, role selection, trust copy and error/resend states. |
| `/challenges` | Home · stakes and streak; Discovery · 3 tabs | Covered | Keep both authenticated home and public discovery contexts explicit. |
| `/challenges/new` | Campaign wizard · brief | Covered | Add creator/brand role variants and validation state. |
| `/challenges/[id]` | Challenge brief | Covered | Add loading, not-found, closed and already-entered states. |
| `/challenges/[id]/submit` | Teaser submit; Round 2 · full content | Covered | Add file validation, upload progress and retry state. |
| `/challenges/[id]/analytics` | Campaign analytics; Growth · the 8 numbers | Covered | Distinguish campaign analytics from operator growth analytics. |
| `/challenges/[id]/invite` | Invite creators | Covered | Add invited, declined, expired and search-empty states. |
| `/character` | Not represented | Missing | Add Character Creator with preset, palette, locked tier and avatar upload states. |
| `/discovery` | Discovery · 3 tabs; Trust ledger | Covered | Add geographic filter and empty results state. |
| `/feed` | Spectator feed · no login | Covered | Add playback loading, muted/unmuted and feed exhaustion states. |
| `/map` | Local · city as identity | Partial | Add Mapbox live map, user-location permission, intent rail, profile pin and sheet states. |
| `/me` | Creator profile; Tiers · functional not cosmetic; Wallet · first payout | Partial | Add full creator profile, edit mode, rally link, avatar upload and tier benefit states. |
| `/notifications` | Notifications · rivalry and urgency | Covered | Add unread, mark-read, empty, permission and loading states. |
| `/r/[code]` | Referral | Partial | Add referral landing, attribution confirmation, invalid-code and conversion states. |
| `/results/[submissionId]` | Win card · share asset; Knockout card | Partial | Add verified result, pending result, not-found and share fallback states. |
| `/rounds/[id]` | Vote deck; Predict · retention for non-entrants; Round result | Covered | Add creator/spectator role split and round-closed state. |
| `/stories` | Not represented | Missing | Add Story hub with owned, invited, joined, FREE/PAID and lifecycle states. |
| `/stories/new` | Not represented | Missing | Add Story creation wizard with OPEN/CHALLENGE explanation and preview. |
| `/stories/[id]` | Not represented | Missing | Add Story brief, claim, content submission, external metrics and publication states. |
| `/v/[code]` | Rally · two-currency split; Battle page · vote gate | Partial | Add public rally deep-link landing, creator context and conversion CTA. |
| `/wallet` | Wallet · first payout | Covered | Add Earnings/Coins tabs, pending, paid, empty and payout setup states. |
| `/admin` | Admin · moderation; Growth · the 8 numbers; States | Covered | Add queue filters, forbidden state and audit detail. |
| `/battle/[challengeId]` | Battle page · vote gate; Bracket | Covered | Add no-active-round, tally hidden and share preview states. |

## Missing or underrepresented screens to add

The next showroom revision should add at least these seven page families:

1. **Public landing and OTP onboarding** as full layouts rather than only phone-prototype states.
2. **Character Creator** including preset selection, palette locks, avatar import and save confirmation.
3. **Mapbox experience** including location permission, selected profile pin, profile sheet, filter empty state and privacy copy.
4. **Story hub, Story creation and Story detail** covering the owned/invited/joined lifecycle.
5. **Rally and referral deep-link landings** for `/v/[code]` and `/r/[code]` as arriving-user experiences.
6. **Creator profile edit and avatar upload** rather than only the public profile.
7. **System states** for protected routes, not found, closed campaign, upload failure, payout pending, invalid referral and no search results.

## Brand voice requirements

Every added page should use the approved master line:

> **Where stories become opportunities.**

The activation CTA is:

> **Start your story.**

Supporting language should remain warm, ambitious and proof-led. Copy must show stakes clearly, distinguish verified facts from projections, avoid coercive financial language, and explain privacy, voting fairness, payout state and rights in plain language.

## Review order

The recommended review sequence is public landing and OTP, Story lifecycle, Character Creator, Mapbox live map, creator profile/edit, deep-link arrivals, then system states. This order follows the acquisition funnel from first impression to activated creator and returning user.
