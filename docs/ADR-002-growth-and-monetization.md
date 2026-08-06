# ADR-002: Growth and monetization architecture

**Status:** Proposed
**Date:** 2026-08-03
**Deciders:** Founder (mortadha), future engineering hires

## Context

ADR-001 covered the core competition mechanic. The founder has since locked three growth/revenue decisions: monetize via a take rate on every funded prize pool plus a paid AI creative-tools module (brand asset generation, creator clip editing); make live challenges publicly spectatable without an account to drive organic reach; and prioritize referral rewards and auto-generated shareable result cards as the primary growth loops. Each of these has real architectural weight beyond "add a screen," so this ADR covers the infrastructure decisions they imply.

## Decision

Add three new modules to the ADR-001 monolith: `payments` gets a take-rate step, a new `creative-studio` module wraps a third-party generation API behind a credit ledger, and a `growth` module handles referrals and share-card generation. Public spectator content is served from the Next.js web app with server rendering, kept architecturally separate from the authenticated mobile API so anonymous traffic spikes can't degrade the core app.

## Key decisions and trade-offs

**Take rate.** Stripe Connect supports an `application_fee_amount` on the transfer that funds escrow — the platform's cut is collected automatically at funding time, no separate billing system needed. Start around 15-20% of the prize pool (in line with comparable creator-marketplace take rates); this is a business decision to revisit once you have real campaign-value data, not an engineering one.

**AI creative tools as a second revenue line.** Image/video generation isn't something to build from scratch — wrap a provider (Fal.ai, Replicate, or a direct Stability/Runway integration) behind your own `creative-studio` module. This needs its own credit ledger (separate from the earnings wallet — credits are purchased, not earned, and shouldn't commingle with payout funds), an async job queue since generation takes seconds-to-minutes (reuse the BullMQ/Redis queue from ADR-001, don't block the request thread), and content moderation on outputs before anything generated can be attached to a public campaign or submission — AI image/video tools are a magnet for policy-violating output (brand likeness misuse, inappropriate imagery) and that risk lands on you as the platform. Sell credits standalone and bundle a monthly allotment into seller subscription tiers later once that pricing exists.

**Public spectator mode.** This is the highest-leverage decision in this ADR for actual virality, and it changes the client architecture: public challenge/battle pages need to be server-rendered (Next.js SSR/ISR) so they're crawlable and load instantly when someone taps a shared link — a client-side-only SPA page kills the "friend shares a link, you land on it in under a second" moment that makes sharing work. Public reads (live vote tallies, entry thumbnails) must be served from a cached, rate-limited public API surface, separate from the authenticated mobile API, so an unpredictable traffic spike from a viral moment can't take down account, payment, or voting endpoints for logged-in users. Vote counts can lag behind real-time by a few seconds for spectators (cache-friendly) without hurting the experience — only actual voters need live-accurate state.

**Referral system.** Needs a `referral_code` per user, attribution on signup (which code was used), and a reward ledger that credits the referrer once the referred user completes a meaningful action (not just signup — e.g., first submission or first vote) to avoid rewarding empty accounts. Reuse the same device/IP fraud-signals module from ADR-001's identity work to block self-referral farming, since referral rewards are a direct cash-equivalent incentive and will be targeted by abuse immediately at any scale.

**Shareable result cards.** Generate these server-side (a lightweight image-rendering service — Satori/`@vercel/og` or a headless-browser screenshot service works well) triggered on key events: advanced a round, won a challenge, earned a stipend. Each card embeds a deep link back to that challenge's public spectator page, which is what actually closes the growth loop: creator shares card to their story → their followers land on a fast public page → sign-up CTA converts a fraction of them. This only works if the public page (previous point) loads fast and looks good link-unfurled (proper Open Graph image tags), so treat the two as one feature, not two.

## Pricing

**Take rate: 20% flat** on every funded prize + stipend pool, collected automatically via Stripe Connect's `application_fee_amount` at funding time. This sits in the middle of the comparable range — UGC/creator marketplaces (Billo, JoinBrands, Trend) commonly take 20-30% of what a brand pays, so 20% is competitive for winning early seller adoption while staying in line with what the market already accepts. Stripe's processing fee (~2.9% + $0.30) is absorbed inside the 20%, not itemized separately, so sellers see one clean number. Revisit toward tiered pricing (e.g. 15% above a monthly spend threshold) once there's enough volume data to justify the complexity — not a launch-day problem.

**AI credits: subscription with monthly allotment + pay-as-you-go top-ups.** Raw generation costs from providers run $0.02-0.05 per image (Flux/Seedream-tier models) and $0.05-0.12 per second of video (Wan2.5/Runway Gen-4 Turbo tier); premium models (Veo3-tier) run up to $0.40/second and should be priced as a distinct premium action, not blended into the base rate. Peg 1 credit = $0.10 of value for both bundled and top-up pricing:

- Standard AI image = 3 credits ($0.30 billed vs ~$0.03 cost, ~90% margin)
- Premium/high-res image = 6 credits ($0.60 billed vs ~$0.05 cost)
- Standard AI video edit, up to 15s (captions, enhance, trending audio) = 12 credits ($1.20 billed vs ~$0.75 cost, ~35% margin — video is the thin-margin action, monitor closely)
- Premium AI video edit, up to 15s (higher-end model) = 25 credits ($2.50 billed vs ~$1.80 cost)

Plans: creators get 20 free credits/month (enough to sample the tool, no card required — this drives submission quality across the marketplace, which benefits sellers and is worth subsidizing). A "Creator Pro" plan at $9.99/mo includes 150 credits (a discount vs paying top-up rate for the same volume). Sellers get a "Creative Studio" add-on at $49/mo for 600 credits, or $149/mo for 2,000 credits for agencies running multiple campaigns (roughly 15-25% cheaper per credit at the higher tier to reward volume). Anyone can buy top-up packs at $15 per 100 credits regardless of plan — priced slightly above the bundled rate so subscribing stays the better deal for regular users.

## Consequences

- Two new revenue lines (take rate + AI credits) instead of one — more billing surface to build and reconcile, but meaningfully de-risks the business from prize-volume-only revenue.
- Public spectator mode means the web app is no longer just a companion to mobile — it's the growth engine, and SEO/link-unfurl quality directly affects CAC. Worth investing real design/perf attention here, not treating it as a stripped-down mobile port.
- AI generation costs (compute + API fees) are a new variable cost line that scales with usage — needs margin monitoring on the credit pricing from day one so heavy users don't erode unit economics.
- Referral and AI-credit systems both need fraud/abuse tooling earlier than they might otherwise — both are directly monetizable or cash-equivalent, which makes them immediate abuse targets.

## Action items

1. [ ] Add `application_fee_amount` to the Stripe Connect funding transfer
2. [ ] Stand up `creative-studio` module: provider integration, credit ledger, async generation queue, output moderation gate
3. [ ] Build public SSR challenge/battle pages on Next.js with OG image tags, separate cached/rate-limited public API
4. [ ] Build referral code issuance, attribution, and reward-ledger logic with fraud checks
5. [ ] Build server-side share-card generation triggered off round-advance and win events
