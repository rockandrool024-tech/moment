# Perokio Production Codebase Organization

**Status:** Local development structure for the rebuilt Perokio application  
**Repository:** `moment`  
**Production rule:** No deployment or GitHub push is implied by this document.

## Organization principles

Perokio is organized as a modular monolith: one web app, one API app, one database contract, and feature-owned modules. This keeps the early product easy to ship while preserving clean boundaries for production hardening later.

The frontend uses Next.js App Router conventions:

- `app/` owns URL routes, route-level loading/error boundaries, metadata, and page composition.
- `components/` owns genuinely shared UI primitives and application chrome.
- `features/` owns domain-specific models, fixtures, loaders, and reusable feature components.
- `lib/` owns cross-feature infrastructure such as API access, auth, formatting, localization, analytics, and feature flags.
- `public/` owns static browser assets only.
- `docs/` owns product contracts, architecture decisions, QA notes, and implementation handoffs.

## Current frontend structure

```text
apps/web/
├── src/
│   ├── app/                    # URL routes and route-level composition
│   │   ├── discovery/          # Discovery route + route-specific styling
│   │   ├── stories/             # Story/opportunity routes
│   │   ├── process/             # Creator journey/process route
│   │   ├── wallet/              # Production wallet route
│   │   ├── profile/             # Public/profile route
│   │   ├── map/                 # Privacy-safe regional map route
│   │   └── ...
│   ├── components/             # Shared shell, navigation, icons, cards, forms
│   │   ├── AppShell.tsx
│   │   ├── BottomNav.tsx
│   │   ├── NavBar.tsx
│   │   ├── JourneyTaskbar.tsx
│   │   ├── StatCard.tsx
│   │   └── ...
│   ├── features/
│   │   └── discovery/          # Discovery domain boundary
│   │       ├── data.ts          # Temporary local fixtures
│   │       └── model.ts         # Typed domain models
│   └── lib/                    # Shared infrastructure and API contracts
│       ├── api-client.ts
│       ├── auth-context.tsx
│       ├── types.ts
│       ├── types-v2.ts
│       └── ...
└── package.json
```

## Discovery feature boundary

The Discovery route is intentionally kept thin. It should compose the experience, not own all domain data.

```text
app/discovery/page.tsx
  ├── reads feature data/types
  ├── owns temporary screen interaction state
  ├── composes shared icons and links
  └── imports route-specific CSS module

features/discovery/model.ts
  └── domain types and unions

features/discovery/data.ts
  └── temporary fixtures until the API contract is connected
```

When the backend is ready, replace the fixture import with a feature loader or hook. Keep the page markup and visual components stable:

```text
features/discovery/
├── api.ts                  # getDiscoveryFeed, getOpportunity, saveOpportunity
├── data.ts                 # local fallback fixtures only
├── model.ts                # API/domain types
├── selectors.ts            # filtering and sorting rules
└── components/
    ├── FeaturedRail.tsx
    ├── ArenaList.tsx
    ├── ArenaRow.tsx
    └── DiscoveryHeader.tsx
```

## Production migration rules

### Local fixtures to backend data

Local fixture data is acceptable for visual development, but it must remain clearly isolated in `features/*/data.ts`. It must not be copied into route components or mixed with API response types.

The API-backed migration should follow this order:

1. Define the response contract in `features/discovery/model.ts`.
2. Add a typed loader in `features/discovery/api.ts` using `lib/api-client.ts`.
3. Add loading, empty, offline, and error states at the route boundary.
4. Keep fixture data as a development fallback only, behind a feature flag.
5. Remove hard-coded counts and rewards from the production path.

### Shared UI versus feature UI

Use `components/` only when a component has at least two real consumers or is application chrome. Discovery-specific components belong under `features/discovery/components/`.

The following remain shared:

- App shell and navigation
- Avatar
- Icons
- Buttons and cards
- Journey progress primitives
- Notifications and sheets
- API/auth infrastructure

### Data and security

The frontend must not be treated as the source of truth for:

- Reward balances
- Eligibility
- Claims
- Journey completion
- Payout status
- Location privacy
- Moderation decisions

Those values must be returned and validated by the backend. The frontend only renders server-authoritative state and sends idempotent mutations.

## Production readiness checklist

### Frontend

- [x] Route-level Discovery screen is responsive at mobile PWA widths.
- [x] Discovery domain types are separated from route markup.
- [x] Temporary fixtures are isolated from shared infrastructure.
- [x] Existing shared icons and ProgressBar styles compile.
- [x] TypeScript, ESLint, and Next production build pass locally.
- [ ] Replace fixture data with typed API loaders.
- [ ] Add route-level loading/error/empty/offline states.
- [ ] Add analytics events for view, filter, open, save, and claim.
- [ ] Add visual regression coverage for 390×844 and desktop breakpoints.
- [ ] Confirm accessibility with keyboard navigation and screen-reader checks.

### Backend integration

- [ ] Implement canonical opportunity endpoint.
- [ ] Implement claim/participation state machine.
- [ ] Implement server-authoritative process stages.
- [ ] Implement wallet and reward ledger responses.
- [ ] Implement privacy-safe regional map responses.
- [ ] Add idempotency keys to claim, save, draft, and submit mutations.
- [ ] Add moderation and audit events.

### Release safety

- [ ] Keep local development, staging, and production environment values separate.
- [ ] Never commit secrets or production database URLs.
- [ ] Run database migrations through reviewed migration files.
- [ ] Run web and API tests in CI before merge.
- [ ] Create a rollback checkpoint before production deployment.
- [ ] Deploy only after explicit approval.

## Current local change policy

All current work remains local in `/home/ubuntu/perokio-v2-codebase`. Do not commit, push, or deploy unless the user explicitly requests that action.
