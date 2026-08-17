/**
 * One-off: generates a VAPID key pair for real Web Push delivery (no FCM/
 * APNs/third-party push account needed). Run once, paste the output into
 * .env (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) and the web app's env
 * (NEXT_PUBLIC_VAPID_PUBLIC_KEY).
 *
 * Usage: pnpm --filter @moment/api exec ts-node -T scripts/generate-vapid-keys.ts
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

// eslint-disable-next-line no-console
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}
VAPID_PRIVATE_KEY=${keys.privateKey}
VAPID_SUBJECT=mailto:admin@example.com

# Web app (.env / .env.local):
NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
