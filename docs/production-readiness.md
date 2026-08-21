# Moment / Perokio — Production readiness

## Current state

The repository now contains a hardened production path for the web app and API. The production stack is designed for one Ubuntu 22.04+ VPS running Postgres, Redis, the NestJS API, the Next.js web runtime and Caddy as the TLS reverse proxy.

The frontend and API production builds pass in the sandbox, the backend test suite passes with 55 tests, the Prisma migration for the Character Creator is included in the API image, and the deployment script now performs preflight checks, pulls fast-forward-only changes, creates a compressed Postgres backup when a database is already running, builds with updated base images, waits for API health, applies migrations and performs HTTPS smoke tests.

The sandbox does not include Docker, so the final image build and Caddy validation must be performed on the target VPS or CI runner. This is an environment limitation, not a TypeScript or application build failure.

## Required production values

Before the first deploy, copy `.env.production.example` to `.env` on the VPS and replace every placeholder. The domain must resolve to the server before Caddy starts because Caddy provisions certificates for both the web and API hostnames.

| Variable | Required for first deploy | Purpose |
|---|---:|---|
| `DOMAIN` | Yes | Public web hostname; `api.${DOMAIN}` is the API hostname. |
| `POSTGRES_PASSWORD` | Yes | Database credential; use a long random value. |
| `JWT_SECRET` | Yes | Token signing secret; use a separate long random value. |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes for `/map` | Public client token restricted to the production domains in Mapbox. |
| `STRIPE_*` | Required before real funding or payouts | Connect onboarding, funding and webhook verification. |
| `MUX_*` | Required before real video upload/playback | Media upload and webhook processing. |
| `TWILIO_*` | Required before real OTP login | Phone verification. |
| `VAPID_*` | Required before web push | Notifications and push subscriptions. |
| `COINBASE_*` | Required only for cosmetic coin checkout | Cosmetic currency checkout and webhooks. |

The Mapbox token is intentionally a client-visible key, but it must be restricted by URL and scope in the Mapbox dashboard. Private secrets must stay in `.env` or the VPS secret manager and must never be committed to Git.

## First deployment

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker "$USER"
# Log out and back in after the group change.

git clone https://github.com/rockandrool024-tech/moment.git
cd moment
cp .env.production.example .env
nano .env
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

The deployment script expects the web hostname at `https://${DOMAIN}` and the API health endpoint at `https://api.${DOMAIN}/health`. The Caddy configuration adds TLS, compression, HSTS, content-type protection, clickjacking protection, a strict referrer policy, a geolocation permission policy and a 50 MB request body limit.

## Operational requirements after go-live

Postgres backups are kept locally under `backups/` for 14 days by the deployment script. A production operator should additionally copy those backups to independent object storage or another server. The next operational layer should add external uptime monitoring for both HTTPS endpoints, alerting on `/health` failures, log retention and a tested restore procedure.

The deployment path is intentionally conservative: it refuses placeholder domains, placeholder secrets, Stripe test keys and dirty working trees. It also uses `git pull --ff-only` and Prisma forward migrations. A schema rollback must be performed by a new forward migration rather than by reverting Git alone.

## Release checklist

Before enabling real creators and brands, confirm the domain records, TLS certificates, production secrets, Stripe live mode, Twilio Verify, Mux upload and webhook signatures, VAPID keys, Mapbox URL restrictions, admin phone allowlist, Postgres backup restore and a real browser smoke test for OTP, challenge creation, submission, voting, wallet and the Mapbox permission flow.
