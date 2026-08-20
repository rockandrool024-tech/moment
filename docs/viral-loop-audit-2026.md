# Moment / Perokio — Viral Loop Audit 2026

## Mission

The product mission is to build a **viral app**, not merely a polished competition UI. Virality must come from a repeatable loop that creates useful value for the person sharing, a clear action for the recipient and a reason to return.

> Story submitted → creator tells it → content is shared → audience watches/votes/predicts → audience enters a useful Perokio surface → audience follows, rallies or creates → new story supply.

## What already exists

The codebase already contains several foundations: a persistent personal referral/rally code, public rally-code resolution, referral attribution, a referral reward that activates after a referred user takes a meaningful action, peer-vote decks with vote-to-unlock copy, streak services, public trust stats, an accessible result ticket, and PWA re-entry prompts.

The referral service follows a valuable trust rule: the reward is not paid at signup alone. A referred user must make a first submission or first vote, and the reward is claimed atomically so the same referee cannot create multiple payouts. The current referral bonus is platform-funded and separated from challenge escrow. This should remain the default before adding stronger incentives.

## Viral mechanics to prioritize

| Priority | Mechanic | User value | Trust requirement |
|---:|---|---|---|
| 1 | Personal rally link | A creator can invite an audience to support a specific journey | Rally must not decide quality winner; cap and label it as momentum/XP |
| 2 | Vote-to-unlock | A creator gets a reason to complete a fair judging task | Never hide paid or safety-critical information; explain the unlock clearly |
| 3 | Shareable outcome cards | Winners and eliminated creators both get a story moment | Do not expose private data; provide accurate round, result and payout state |
| 4 | Spectator predictions | Non-creators gain a reason to return after a round closes | Use points/status until legal and anti-fraud review is complete |
| 5 | Survivor / participation rewards | More creators experience a meaningful outcome | Keep payout rules visible before entry and prevent prize ambiguity |
| 6 | Visible event clock | Creates urgency and turns a feed into an event | Use exact server time and show timezone/round state |
| 7 | Deep links | Social traffic lands on a relevant story, creator, rally or result | Preserve attribution without redirecting to a generic homepage |

## Rules for a healthy viral loop

A rally can increase visibility, momentum or a crowd-favourite bonus, but it must never overpower blind quality scoring. Public momentum should never eliminate a creator. Predictions should be framed as audience participation, not gambling, until reviewed for the launch jurisdiction. The application should not use an opaque hostage pattern that conceals money, safety, rights or an irreversible result; any vote-to-unlock step must state what is locked and why.

Growth claims such as viral coefficients, D1/D7 targets, user counts or brand repeat rates are **hypotheses**, not product facts. The permanent site should instrument them and validate them with real cohorts before treating them as proven. The minimum dashboard should track share creation, share clicks, referred signups, referred first actions, vote-deck completion, story claims, creator activation, external publication, return visits, payouts and fraud/flag rates.

## MVP funnel

The first public loop should be small and observable: a creator enters or claims a story, receives a personal rally/deep link, shares an outcome or progress card, a visitor watches and makes one meaningful action, then the visitor is invited to vote, predict, follow or claim a story. Each step must have one primary CTA and one measurable event.

## Current implementation gap

The new UI has the Mapbox intent rail, privacy-first local momentum, a Story Economy task bar and the parrot brand asset. The next growth implementation should connect the existing rally/referral contracts to visible share surfaces, introduce a reusable share-card component, add outcome/knockout variants and surface server-backed referral stats on the creator profile. No fabricated viral metrics should be displayed.
