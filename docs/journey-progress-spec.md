# Perokio Journey Progress — Product and UX Specification

## Purpose

Journey Progress makes the creator’s journey visible from the moment they discover an opportunity to the moment the final video is judged. It should feel like a clear path with meaningful milestones, not a generic percentage indicator.

> **Every step moves your story forward.**

The component must answer three questions at all times: **Where am I? What do I do next? What do I unlock or receive?**

## Journey stages

| Stage | Label | Completion condition | Primary next action | User value |
|---|---|---|---|---|
| 1 | Discover | Creator opens a relevant Story or Challenge brief. | Read the brief. | Clear opportunity and context. |
| 2 | Claim | Creator claims an Open Story or enters a funded Challenge. | Claim or enter. | A committed place in the journey. |
| 3 | First teaser | Teaser is uploaded and accepted by validation. | Submit teaser. | Low-risk first creation milestone. |
| 4 | Peer review | Creator’s teaser is in the blind review deck. | Complete the required votes. | Fair feedback and eligibility to advance. |
| 5 | Advance | Round result confirms the creator moves forward. | Start the full piece. | Progress proof and guaranteed survivor reward where applicable. |
| 6 | Full video | Full video is uploaded and accepted. | Submit final video. | A finished piece attached to the creator profile. |
| 7 | Final vote | Final video is available for blind or final public review. | Watch, vote or wait for reveal. | Reputation, rating and outcome. |
| 8 | Reward and share | Result is verified and payout/reputation state is updated. | View wallet and share result. | Money, proof, social momentum and next opportunity. |

## Component states

| State | Visual treatment | Copy pattern | Interaction |
|---|---|---|---|
| Completed | Filled node, check icon, muted connector. | “Done” plus an optional earned reward. | Can reopen the relevant result or upload. |
| Current | Lime or cyan focus node, visible progress, gentle pulse once on entry. | One direct action, one short explanation. | Primary CTA advances the journey. |
| Available | Bright outline node and short preview. | “Ready when you are.” | Opens the next route. |
| Locked | Low-contrast node with lock icon. | Explain the prerequisite, never only “locked.” | No action until prerequisite is met. |
| In review | Animated progress line with reduced-motion fallback. | “Your work is being reviewed.” | View rules or return to home. |
| Failed/retry | Coral state with preserved work. | Say what was saved and how to retry. | Resume, replace or appeal. |
| Completed journey | Gold/lime celebration, no blocking modal. | “Your story reached the reveal.” | Wallet, share result or start next story. |

## Placement

The component should appear in three contexts with different density:

1. **Challenge detail:** a horizontal or two-column path showing what the creator must do before entering and submitting.
2. **Creator home/profile:** a compact “Your journey” card showing current stage, progress and next action across active Stories or Challenges.
3. **Result and wallet:** a completion state that connects the result to payout, rating, tier progress and the next opportunity.

On mobile, the component becomes a vertical stepper or horizontally scrollable milestone rail. The current milestone must be visible without requiring the user to scroll sideways. On desktop, it can use a horizontal rail with labels and reward annotations.

## Motion rules

The current milestone enters with a short 240 ms fade-and-translate animation. Completing a milestone animates the connector from the previous node to the new node once, then stops. The current node may use a soft 2-second pulse, but it must not continuously distract the user. Celebration uses a restrained lime/gold shimmer rather than confetti over financial information.

When `prefers-reduced-motion: reduce` is active, nodes appear in their final state immediately, connectors change color without sliding, and all information remains available as text. Motion must never be the only signal of progress.

## Copy rules

The component uses warm, ambitious and proof-led language. It should say **“Submit your teaser”**, **“Your teaser is in review”**, **“You advanced — your next reward is guaranteed”**, **“Submit your final video”** and **“Your result is verified.”** It should not say “grind,” “pay to unlock,” “guaranteed win” or any language that implies rally activity can buy a quality result.

The component should preserve the separation between:

- **Quality progress:** submission, blind peer review, advancement and final vote.
- **Momentum progress:** rally supporters, XP, crowd-favourite eligibility and sharing.

## Data contract

The component should accept a list of stages with `id`, `label`, `description`, `status`, `reward`, `href` and optional `timestamp`. The parent page owns the business logic. The component must not infer completion from a percentage or fabricate a reward. If data is unavailable, it renders a skeleton or honest unavailable state.

## Accessibility

The rail uses semantic ordered-list markup, visible labels and an `aria-current="step"` marker for the current stage. Every locked state explains its prerequisite in text. Color is never the only state indicator. Keyboard users can reach every available milestone. The mobile version preserves large touch targets and safe-area spacing.
