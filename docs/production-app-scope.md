# Production scope: creator-competition marketplace

This covers what's needed beyond the mocked screens (challenge creation, submission, round 1 cut, blind vote, reveal/payout, discovery feed, creator map/leaderboard, onboarding, profile, wallet, notifications, settings, seller dashboard, campaign analytics) to take the app to production.

## Remaining screens

A few user-facing screens round out the flows already mocked. Creators need a challenge detail/brief page they land on before submitting (full rules, past winners, sample entries), a saved/bookmarked campaigns list, and a way to view a revealed entry with comments once a round closes. Sellers need an "invite creators" screen that pulls straight from the tier/map leaderboard, a campaign creation wizard beyond the single form shown (funding step, checklist builder, round scheduling), and a brand verification/KYB flow before they can fund a campaign. Both sides need a dispute/report screen (flag a submission, appeal an elimination), a help/support center, and a terms-of-service acceptance step at signup. A lightweight in-app chat or comment thread between seller and finalists is worth having for logistics (shipping product, usage rights) even though public voting stays blind. Discovery is now mocked as three tabs (campaigns, creators, brands) with public stat blocks and a brand profile page — see ADR-004, which adds two schema requirements (`Payout.paid_at` plus a due date, and a bidirectional `Rating` table) and a post-campaign rating prompt on both sides.

## Payments and escrow

Stripe Connect handles the money: sellers fund a campaign's prize plus stipend pool into escrow at creation, funds sit held until the campaign resolves, and payouts (winner + finalist stipends) fire as Connect transfers when the final round closes. Production needs webhook handling for payment events, a reconciliation job that confirms escrow balances match what the app shows, refund/cancellation logic if a seller pulls a campaign before it resolves, and 1099/tax-form generation for creators who cross reporting thresholds in the US (Stripe Connect covers most of this natively).

## Identity and trust

Phone-OTP verification gates voting, per the elimination design. Production also needs identity verification for anyone receiving payouts (KYC via Stripe Identity or Persona, required by Stripe Connect anyway), device/IP fingerprinting to catch vote-multiplying, and a minimum-account-age or activity threshold before a new account can vote — all feeding a fraud-signals dashboard the team can tune without a redeploy.

## Content pipeline

Video upload, transcoding, and playback run through Mux or Cloudflare Stream rather than self-hosted storage. Production needs virus/malware scanning on upload, automated content moderation (nudity/violence detection via the video provider's built-in tools or a service like Hive) before a submission goes public, thumbnail generation, and a takedown path for copyright or brand-safety complaints.

## Admin and moderation

Now mocked: the admin console with a flagged-content queue, brand/KYB approval queue, and stats overview (open flags, pending approvals, disputes, live campaigns). Still needed behind it: the actual coordinated-voting detection logic flagged in ADR-003 (pattern-match small groups of accounts that consistently vote together — deferred to backlog until there's real voting data to tune against), a full dispute-resolution workflow (a creator claims they were wrongly eliminated), the ability to adjust a round's schedule if something breaks mid-competition, and a god-view of every campaign's state machine for support/debugging. This remains the highest-leverage piece of "invisible" work — competition products live or die on trust, and trust breaks fastest when there's no way to fix a bad round quickly.

## In-person / local UGC campaigns

Now mocked: a seller-side toggle marking a campaign as requiring an in-person visit (with store address and visit-slot hours), the enhanced hot-creators map now also showing store/brand pins, and a creator-side booking screen. Production needs real scheduling infrastructure behind this — slot availability, booking confirmation, reminder notifications, a check-in flow when the creator arrives on-site (QR code or geofenced check-in is a common pattern), and a cancellation/no-show policy tied into the stipend logic (does a no-show creator forfeit their spot in the round?). Physical presence also raises liability questions worth a light legal review — a creator visiting a brand's physical location is a different risk profile than one filming at home.

## Notifications and communication

Push notifications (the mocked feed) need a delivery backend — Firebase Cloud Messaging / APNs for mobile, plus email as a fallback channel for round-closing, elimination, and payout events, and SMS for time-sensitive things like "voting closes in 1 hour." A notification-preferences system (per-category opt-out) sits behind the settings toggle already mocked.

## Data and analytics

The campaign analytics screen implies an event pipeline: track view, submit, advance, vote, and payout events per campaign, feeding both the seller-facing funnel and internal product metrics (retention, repeat-seller rate, time-to-first-win for creators). Search/indexing (Algolia or Postgres full-text to start) powers the discovery page's search and filter chips.

## Growth and monetization (see ADR-002)

Now mocked: the brand AI asset generator and creator AI clip editor (both credit-metered), the public no-login spectator feed of live battles, the referral invite screen, and the auto-generated shareable result card. Backend work these imply: a third-party image/video generation provider integration behind an async job queue, a separate AI-credit ledger distinct from the earnings wallet, output moderation on anything AI-generated before it touches a public campaign or submission, a cached/rate-limited public API surface isolated from the authenticated app, server-side rendering with Open Graph tags for public challenge pages, server-side share-card image generation triggered on round-advance and win events, and a referral attribution + reward ledger with the same fraud-signals tooling used for vote integrity. Full detail in ADR-002.

## Compliance and legal

Sellers and creators both need to accept terms that cover prize eligibility rules, content usage rights (can the seller reuse a winning video in ads?), and dispute resolution process, ideally versioned so re-acceptance is enforced when terms change. Depending on target markets, sweepstakes/prize-competition law varies by jurisdiction and is worth a legal review before launch, since "pay to enter, win a cash prize" schemes can trigger gambling or lottery regulation in some regions if not structured carefully (e.g., no entry fee, skill-based judging).
