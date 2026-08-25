# Prompt for Claude — Deploy Perokio to the Hostinger VPS

You are the production deployment engineer operating directly inside a Hostinger KVM terminal. Deploy the Perokio application carefully and report every result clearly.

## Mission

Deploy the complete Perokio/Moment application to production on the Hostinger VPS. Do not use the local mock API in production. Use the production Docker Compose and Caddy configuration already present in the GitHub repository.

The deployment is authorized by the project owner, but you must protect secrets, avoid destructive actions and never claim success until HTTPS, the API health check and the main web page have been verified.

## Infrastructure context

| Item | Value |
|---|---|
| VPS public IPv4 | `72.62.33.78` |
| Operating system | Ubuntu 24.04 LTS |
| Hostname | `srv1870310` |
| SSH user | `root` |
| GitHub repository | `rockandrool024-tech/moment` |
| Production domain | `perokio.com` |
| Web alias | `www.perokio.com` |
| API domain | `api.perokio.com` |
| DNS | `@` A → `72.62.33.78`; `www` CNAME → `perokio.com`; `api` A → `72.62.33.78` |
| Repository branch | `main` |
| Deployment directory | `/opt/moment` |

The VPS has already been checked and has Docker, Docker Compose and Git installed. The expected production files are:

- `docker-compose.prod.yml`
- `deploy/deploy.sh`
- `deploy/Caddyfile`
- `.env.production.example`
- `apps/api/Dockerfile`
- `apps/web/Dockerfile`

## Non-negotiable safety rules

1. Never print, echo, cat, commit or paste secrets into the chat or into command output. This includes database passwords, JWT secrets, Stripe keys, Twilio credentials, Mux credentials, VAPID private keys, Coinbase credentials and GitHub tokens.
2. Never use the preview `mock_api.py` as a production API.
3. Never delete Docker volumes. Existing data must be preserved.
4. If `/opt/moment` already exists, do not delete it. Rename it to `/opt/moment.previous.<timestamp>` only after checking its contents, then clone the current repository into `/opt/moment`.
5. Do not expose PostgreSQL, Redis or the API ports directly to the public internet. Only Caddy should publish ports 80 and 443.
6. Do not invent provider keys. If a production integration is not configured, leave it disabled and report it clearly.
7. Do not weaken CORS, JWT, upload validation, payment verification, voting integrity or rate limits to make the deployment pass.
8. Do not run destructive database commands such as `prisma migrate reset`, `DROP DATABASE`, volume deletion or schema force-push.
9. Do not report “production live” until all required smoke tests pass over HTTPS.
10. If a credential is needed, pause and ask the human to enter it directly into the VPS terminal using a hidden input. Never ask the human to paste it into chat.

## Phase 1 — Preflight

Run these commands and inspect the results without printing any environment file:

```bash
set -euo pipefail
printf '== identity ==\n'
whoami
hostname
printf '== system ==\n'
. /etc/os-release
printf '%s\n' "$PRETTY_NAME"
free -h
df -h /
printf '== runtime ==\n'
docker --version
docker compose version
git --version
printf '== ports ==\n'
ss -tulpn | grep -E ':22|:80|:443' || true
printf '== dns ==\n'
getent hosts perokio.com || true
getent hosts www.perokio.com || true
getent hosts api.perokio.com || true
```

If Docker is missing, install it using the official Docker installation method for Ubuntu 24.04. Enable and start Docker. Do not continue if the filesystem has less than 10 GB free or if Docker cannot start.

If UFW is enabled, allow only SSH, HTTP and HTTPS before enabling it:

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw status verbose
```

Do not change SSH authentication or close the current session.

## Phase 2 — Authenticate and clone

Check GitHub authentication without exposing credentials:

```bash
gh auth status
```

If GitHub CLI is not authenticated, run:

```bash
gh auth login --hostname github.com --git-protocol https --web
```

The human must complete the device authorization in their own browser. Do not request or display their token.

Then prepare the deployment directory without deleting existing application data:

```bash
install -d -m 0755 /opt
if [ -d /opt/moment ]; then
  mv /opt/moment "/opt/moment.previous.$(date +%Y%m%d%H%M%S)"
fi
gh repo clone rockandrool024-tech/moment /opt/moment
cd /opt/moment
git checkout main
git pull --ff-only origin main
git log -1 --oneline
```

If the repository is already cloned and clean, use `git fetch origin`, then `git reset --hard origin/main` only after confirming that `/opt/moment` contains no uncommitted human changes. Never overwrite an uncommitted production change without asking.

## Phase 3 — Create production environment safely

Work only inside `/opt/moment` and make the environment file readable only by root:

```bash
cd /opt/moment
umask 077
cp .env.production.example .env
chmod 600 .env
```

Set the non-secret values without printing the file:

```bash
sed -i 's/^DOMAIN=.*/DOMAIN=perokio.com/' .env
sed -i 's/^POSTGRES_USER=.*/POSTGRES_USER=moment/' .env
sed -i 's/^POSTGRES_DB=.*/POSTGRES_DB=moment/' .env
sed -i 's|^VAPID_SUBJECT=.*|VAPID_SUBJECT=mailto:admin@perokio.com|' .env
sed -i 's|^AVATAR_UPLOAD_DIR=.*|AVATAR_UPLOAD_DIR=/var/lib/moment/avatars|' .env
```

Generate local secrets only if they are still placeholder values. Never show them:

```bash
python3 - <<'PY'
from pathlib import Path
import secrets
p = Path('.env')
s = p.read_text()
if 'POSTGRES_PASSWORD="change-me' in s:
    s = s.replace('POSTGRES_PASSWORD="change-me-to-a-long-random-string"', f'POSTGRES_PASSWORD="{secrets.token_urlsafe(32)}"')
if 'JWT_SECRET="change-me' in s:
    s = s.replace('JWT_SECRET="change-me-to-a-long-random-string"', f'JWT_SECRET="{secrets.token_urlsafe(48)}"')
p.write_text(s)
PY
chmod 600 .env
```

The following production values are required for the corresponding features. If they are not already available in a secure VPS secret store, pause and ask the human to enter them directly with hidden input:

| Variable group | Required for |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Live map rendering; use the public `pk.` token only. |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | Real OTP login. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Real brand funding and payouts. |
| `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_WEBHOOK_SECRET` | Video upload and playback processing. |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web push notifications. |
| `COINBASE_COMMERCE_API_KEY`, `COINBASE_COMMERCE_WEBHOOK_SECRET` | Cosmetic coin crypto checkout only. |
| `ADMIN_PHONE_NUMBERS` | Admin access; use E.164 numbers and do not leave this open accidentally. |

Do not add fake values. If a feature is not configured, the application must fail honestly or show its disabled state.

Before starting services, validate the Compose file without printing interpolated secrets:

```bash
docker compose --env-file .env -f docker-compose.prod.yml config -q
```

If this fails, diagnose the exact missing variable without printing the value of any secret.

## Phase 4 — Build and start production

Make the deployment script executable, inspect it once, then run it:

```bash
cd /opt/moment
chmod +x deploy/deploy.sh
bash -n deploy/deploy.sh
./deploy/deploy.sh
```

The script should build the API and web images, start PostgreSQL, Redis, API, web and Caddy, wait for health checks, apply forward-only Prisma migrations and run the configured HTTPS smoke test.

If the script fails, do not improvise a destructive workaround. Inspect only relevant service status and recent logs, redacting secrets:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=100 api
docker compose -f docker-compose.prod.yml logs --tail=100 web
docker compose -f docker-compose.prod.yml logs --tail=100 caddy
```

Do not use `docker compose down -v`.

## Phase 5 — Verify HTTPS and application health

Run the following tests:

```bash
set -e
curl -fsSIL https://perokio.com/
curl -fsSIL https://www.perokio.com/
curl -fsS https://api.perokio.com/health
curl -fsS https://perokio.com/ | head -c 200 >/dev/null
docker compose -f docker-compose.prod.yml ps
```

Verify that:

- `perokio.com` loads the web app over HTTPS.
- `www.perokio.com` loads successfully and does not show a certificate error.
- `api.perokio.com/health` returns a successful health response.
- Caddy has issued valid certificates for the web and API hostnames.
- PostgreSQL and Redis are healthy.
- The API and web containers are running without crash loops.
- PostgreSQL, Redis, API and web are not published directly to the host.
- The avatar volume exists and is mounted persistently.
- The Mapbox token was not committed to Git.

Then run these application smoke checks in a browser or with HTTPS requests:

1. Landing page and approved brand copy.
2. Login page and its honest provider state.
3. Public challenges page.
4. Mapbox page and privacy-first location control.
5. Public Battle and Results pages.
6. Character Creator access state.
7. API health endpoint.

Do not attempt real payment, OTP delivery, payout or crypto checkout during smoke testing unless the human explicitly authorizes a live transaction. A configuration check is sufficient.

## Phase 6 — Final report

At the end, report:

| Item | Required output |
|---|---|
| Git commit | Short SHA deployed from `origin/main`. |
| Web URL | `https://perokio.com` and status. |
| API URL | `https://api.perokio.com/health` and status. |
| TLS | Certificate status for root, www and api. |
| Containers | Healthy/running status for all services. |
| Migrations | Applied migration status, without exposing database credentials. |
| Provider integrations | Configured, disabled or awaiting credentials. |
| Backups | Whether the first Postgres backup completed. |
| Remaining blockers | Exact action required from the human, if any. |

Use the words **DEPLOYMENT COMPLETE** only if the HTTPS smoke tests, health check, migrations and container checks all pass. Otherwise use **DEPLOYMENT BLOCKED** and explain the next safe action.
