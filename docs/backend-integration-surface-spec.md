# Moment / Perokio — Backend integration surface spec

## Character Creator

The character creator will use a small, controlled preset system rather than accepting arbitrary client-generated payloads. The first version persists `characterPreset`, `characterPalette` and `characterUpdatedAt` on the authenticated user. The preset is a visual identity choice for the public avatar and profile, not KYC and not a real-person identity document.

The backend contract will be:

| Method | Route | Purpose |
|---|---|---|
| `GET` | `/users/me/character` | Return the saved preset, palette and avatar generation timestamp. |
| `PATCH` | `/users/me/character` | Validate and save an allowed preset and palette. |
| `POST` | `/users/me/avatar/generate` | Regenerate the public avatar after the selected preset is saved. |

Allowed presets will be a fixed server-side union such as `parrot`, `street`, `studio` and `night`. Allowed palettes will be a fixed union based on the Perokio brand system. The API will reject unknown values and will never accept a URL or arbitrary HTML from the client.

## Map location setup

The first production-safe location flow will use browser geolocation only after an explicit user action. The browser location will be used to center the viewer’s Mapbox camera and to show a temporary “you are here” state in the current session. Exact coordinates will not be sent to the backend in the first version, will not be used to create public pins, and will not be used for ranking or recommendations.

The authenticated profile will retain the existing free-text `location` field for a user-entered city label. The map will distinguish three states: `unknown`, `permission-granted-session-only` and `permission-denied`. The UI will always offer a manual fallback and a clear reset action. Public pins remain aggregated/stylized and are never derived from the visitor’s precise browser coordinates.

## Privacy and safety requirements

The map must not request geolocation on page load. It must explain why permission is useful before invoking the browser prompt, and must continue to work without permission. The app must not persist raw latitude or longitude in local storage, query parameters, analytics payloads or public API responses. The current user marker is a session-only visual affordance.

The character preset does not change vote weight, ranking, payout eligibility or identity verification. The wallet remains connected to the real wallet and payout contracts; cosmetic character choices may use coins in a later iteration but are free in the first integration.
