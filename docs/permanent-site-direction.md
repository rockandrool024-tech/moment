# Moment / Periokio — Permanent Site Direction

**Status:** Proposed v3 direction
**Product model:** Story Economy + Creator Growth Network
**Primary references:** Whop, Snapchat Snap Map, Mapbox GL JS clustering

## Executive direction

Moment should not become a generic creator marketplace with a map attached. The stronger product is a **story economy and creator growth network**: people submit stories, creators discover and tell them, content travels across Perokio and social platforms, performance builds reputation, and the next opportunity is recommended from that record.

> **Story → Creator → Content → Distribution → Audience → Performance → Reputation → Next opportunity**

Challenges remain important, but they should be presented as **premium events inside the wider story network**. A free story creates curiosity. A challenge creates stakes, anticipation, voting, sharing and recurring visits.

## Product layers

| Layer | User question | Permanent-site expression |
|---|---|---|
| Stories | What can I tell or discover? | Story feed, local stories, recommended briefs, story links |
| Creation | What should I do next? | Task bar, claim flow, research/create/submit steps |
| Performance | Is my work moving? | Performance windows, public momentum, reach, follower conversion |
| Economy | What did I earn or unlock? | Wallet, payouts, paid stories, challenges, reputation |

This model preserves the current 16-page v1 while changing the hierarchy. The homepage should lead with **three things that need the user**, not only with a list of campaigns: finish an active story, judge a round, or review a performance window.

## What to borrow from Whop

Whop treats a business space as a configurable product composed of modular apps. It combines creation tools with a built-in marketplace, category browsing, trending searches and a single next action such as Join. This suggests a Moment campaign page should behave like an **active story space**, not a static listing: the brief, task sequence, content, performance and rights should be grouped around the user’s role. The reference is the official Whop guide.[1]

For Moment, the adaptation is:

| Whop pattern | Moment adaptation |
|---|---|
| Modular business space | Story space with brief, creator task bar, content and performance modules |
| Marketplace discovery | Stories, creators and challenges with category chips and local momentum |
| Trending searches | Trending stories, active zones and closing-soon challenges |
| Join as the dominant CTA | Claim, Enter, Watch or Vote as the single context-aware next action |
| Store/product page | Story page with compensation, licensing, performance window and creator fit |

The key principle is **progressive disclosure**. Do not expose every module to every role. A creator needs the next task; a storyteller needs claims and content; a brand needs campaign performance and payouts.

## What to borrow from Snap Map

Snapchat’s official Snap Map support separates the map into distinct intentions: adding content, exploring on the web, finding friends and places, viewing public stories and managing location visibility.[2] Moment should use the same mental model instead of treating the map as a canvas of decorative pins.

The Mapbox experience should begin with a compact intent rail:

| Map intent | Moment label | Data shown |
|---|---|---|
| Explore | **Explore momentum** | Active creators, stories and challenges by zone |
| Nearby | **Near you** | Approximate local activity, never exact private location |
| Live | **Live now** | Open rounds, active votes and recently published content |
| People | **Creators** | Creator tiers, wins, current stories and public links |
| Places | **Story zones** | Public neighborhoods or city-level activity areas |
| Privacy | **Visibility** | Public, approximate or hidden location mode |

Moment should borrow the **layered discovery** idea, not the friend-location idea. The map must never imply that the product is tracking people in real time unless a user has explicitly opted into an appropriate visibility mode. For the current model, the safest default remains approximate or stylized zones.

## Mapbox concept: Local Momentum Map

The current implementation already uses Mapbox as the background scene and renders pins as a React overlay because the existing `MapPin` contract only contains stylized `x`/`y` positions, not latitude/longitude. That is acceptable as a visual prototype but not enough for a production-grade geographic discovery layer.

The permanent map should evolve in two stages.

### Stage A — safe visual upgrade

Keep the current privacy-preserving stylized coordinates, but add a Snap Map-like layer switcher, activity chips, a selected-zone bottom sheet and an explicit visibility control. Introduce map cards for **story zones**, not private individual locations. Animate camera recentering and sheet transitions, but keep pins readable and keyboard-focusable.

### Stage B — real Mapbox clusters

Extend the public map contract with an approximate geographic representation:

```ts
interface MapPinV2 extends MapPin {
  zoneId: string;
  latitude: number;
  longitude: number;
  locationPrecision: "city" | "district" | "approximate";
  activityKind: "creator" | "story" | "challenge" | "live_round";
}
```

Use a GeoJSON source with Mapbox clustering. Mapbox’s official clustering example uses a `circle` layer, a `point_count` label and `getClusterExpansionZoom` to move from a dense region to its individual points.[3] Moment should use that pattern as follows:

| Zoom state | Visual | Interaction |
|---|---|---|
| City / country | Large activity clusters | Tap cluster to expand and ease to the next zoom |
| District | Zone cards and small clusters | Tap zone to open a story/challenge sheet |
| Local | Approximate public pins | Tap creator/story/challenge to open a deep link |
| Selected | Bottom sheet with preview | Open profile, story, challenge or rally link |

The map should not render dozens of independent avatars at low zoom. Clustering keeps the visual calm, improves performance and communicates **activity density** rather than surveillance.

## Color template v3

The existing lime-on-near-black direction is strong and should remain recognizable. The improvement is to give Mapbox, performance and trust states their own tonal roles instead of using lime for everything.

| Token | Value | Role |
|---|---|---|
| `--bg` | `#080906` | Primary app background |
| `--surface-1` | `#10110C` | Cards and navigation surfaces |
| `--surface-2` | `#171912` | Elevated cards, sheets, controls |
| `--surface-3` | `#202319` | Hover, selected control, input fill |
| `--map-night` | `#0B1520` | Map scene / cool geographic contrast |
| `--fg` | `#F4F7E4` | Primary text |
| `--muted` | `#A5A890` | Secondary text |
| `--accent` | `#CFFF3D` | Primary action, active progress, selected zone |
| `--accent-soft` | `#E9FF96` | Accent text on dark surfaces |
| `--live` | `#FF5D66` | Live/open state, never the only status signal |
| `--warning` | `#F2B84B` | Pending, deadline, attention |
| `--info` | `#68A9FF` | Verified information, current viewer, map utility |
| `--success` | `#43D17A` | Paid, completed, verified outcome |
| `--story-coral` | `#FF8A65` | Storytelling / creator content accent |
| `--challenge-violet` | `#9B8CFF` | Premium event / competition accent |

The map can use a cool navy-black base with lime for active momentum, coral for Stories, violet for Challenges and blue for current-viewer or privacy controls. Every color-coded state must also have a label, icon or shape so the map remains understandable without color perception.[4]

## Motion template

Motion should reinforce **progress, presence and reward**, not add noise. Use transitions under 300ms for common UI interactions and reserve longer camera movement for map recentering or rare celebration moments.

| Interaction | Motion | Timing |
|---|---|---:|
| Button press | `scale(0.97)` and return | 120–160ms |
| Chip/filter selection | Background and border transition | 150–180ms |
| Card entrance | Opacity + `translateY(8px)` with stagger | 180–240ms |
| Bottom sheet | `translateY(12px)` to `translateY(0)` | 220ms |
| Map cluster expansion | `easeTo` / camera movement | 500–700ms |
| Story progress step | Small ring draw or dot fill | 300–450ms |
| Vote confirmation | Brief lock/check transition | 180–240ms |
| Winner/result reveal | Ticket reveal + confetti only once | 500–900ms |

Respect `prefers-reduced-motion`: disable the map orbit, pin pulses, staggered entrances and celebration particles, while keeping state changes and focus movement clear. The motion system should use transform and opacity wherever possible, not layout-changing properties.[5]

## Priority enhancements

The next permanent-site release should prioritize the following changes rather than a full rewrite.

| Priority | Enhancement | Why it matters |
|---:|---|---|
| 1 | Homepage task bar | Turns the network into a workflow engine and gives creators a reason to return |
| 2 | Map intent rail + zone sheet | Makes Mapbox a discovery product rather than a background visual |
| 3 | Story performance window | Makes external performance fair, auditable and understandable |
| 4 | Public Momentum language | Clarifies that public voting changes performance but never eliminates a creator |
| 5 | Deep story / creator / rally / storyteller links | Converts social traffic directly into useful Periokio surfaces |
| 6 | Profile career dashboard | Turns reputation into a reason to keep creating |
| 7 | Structured licensing chips | Prevents ambiguity when stories become paid or sponsored |
| 8 | Modular role-based page sections | Applies Whop’s progressive-disclosure principle without adding clutter |

## Product gates for the permanent site

The permanent site should measure story supply, story activation, creator activation, external distribution, performance, retention and monetization. Brand repeat rate remains useful, but it should not be the only validation gate. The product should be able to answer whether stories get claimed, whether creators finish them, whether content reaches external audiences and whether creators return for another opportunity.

## References

[1]: https://whop.com/blog/what-is-a-whop/ "Whop — What is a whop? A complete guide to whops"
[2]: https://help.snapchat.com/hc/en-us/sections/5689786363284-Snap-Map "Snapchat Support — Snap Map"
[3]: https://docs.mapbox.com/mapbox-gl-js/example/cluster/ "Mapbox GL JS — Create and style clusters"
[4]: https://m2.material.io/design/color/dark-theme.html "Material Design — Dark theme"
[5]: https://www.justinmind.com/web-design/micro-interactions "Justinmind — Web micro-interactions and design guidance"

## Permanent deployment path

The repository already includes a production Dockerfile, a Postgres/Redis/API/web composition and a Caddy reverse proxy guide. The intended permanent path is therefore a single Ubuntu VPS with two DNS records: the public site domain and `api.` on the same host. Caddy provisions TLS for both domains, while Docker Compose runs Postgres, Redis, the Nest API and the Next web container.

The Mapbox token belongs in the VPS `.env` as `NEXT_PUBLIC_MAPBOX_TOKEN` and is passed as a Docker build argument because Next.js inlines public variables into the browser bundle. It must not be committed to GitHub. The same rule applies to JWT, Stripe, Mux, Twilio, VAPID and Coinbase secrets. The current public preview injects the user-provided Mapbox token at runtime only; it is not stored in the repository.

The first production launch still needs a real domain, an Ubuntu VPS with at least the repository’s documented memory requirement, DNS A records, strong database/JWT secrets and the provider keys that power OTP, media uploads and payouts. Until those are supplied, the preview is suitable for UI review but is not a production service.
