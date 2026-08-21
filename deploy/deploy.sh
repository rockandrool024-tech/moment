#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -f docker-compose.prod.yml)
BACKUP_DIR="${ROOT_DIR}/backups"

require_env() {
  local key="$1"
  local value="${!key:-}"
  if [[ -z "$value" || "$value" == "change-me-to-a-long-random-string" || "$value" == "example.com" ]]; then
    echo "Missing or placeholder production value: ${key}" >&2
    exit 1
  fi
}

if [[ ! -f .env ]]; then
  echo "Missing .env — copy .env.production.example to .env and fill in production values first." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

for key in DOMAIN POSTGRES_PASSWORD JWT_SECRET NEXT_PUBLIC_MAPBOX_TOKEN; do
  require_env "$key"
done

if [[ "${DOMAIN}" == *example.com ]]; then
  echo "DOMAIN still points at an example value." >&2
  exit 1
fi

if [[ -n "${STRIPE_SECRET_KEY:-}" && "${STRIPE_SECRET_KEY}" == sk_test_* ]]; then
  echo "Refusing to deploy Stripe test keys to production." >&2
  exit 1
fi

if [[ -n "${NODE_ENV:-}" && "${NODE_ENV}" != "production" ]]; then
  echo "NODE_ENV must be production when set in .env." >&2
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit or stash changes before deploying." >&2
  exit 1
fi

echo "==> Pulling latest code"
git pull --ff-only

mkdir -p "$BACKUP_DIR"
if "${COMPOSE[@]}" ps --status running postgres 2>/dev/null | grep -q postgres; then
  backup_file="${BACKUP_DIR}/moment-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
  echo "==> Backing up Postgres to ${backup_file}"
  "${COMPOSE[@]}" exec -T postgres pg_dump -U "${POSTGRES_USER:-moment}" -d "${POSTGRES_DB:-moment}" | gzip > "$backup_file"
fi

cleanup_backups() {
  find "$BACKUP_DIR" -type f -name 'moment-*.sql.gz' -mtime +14 -delete
}
cleanup_backups

echo "==> Building production images"
"${COMPOSE[@]}" build --pull

echo "==> Starting production stack"
"${COMPOSE[@]}" up -d

echo "==> Waiting for API health"
for attempt in {1..30}; do
  if "${COMPOSE[@]}" exec -T api node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    break
  fi
  if [[ "$attempt" == 30 ]]; then
    echo "API did not become healthy in time." >&2
    "${COMPOSE[@]}" logs --tail=120 api >&2 || true
    exit 1
  fi
  sleep 5
done

echo "==> Applying database migrations"
"${COMPOSE[@]}" exec -T api npx prisma migrate deploy

echo "==> Running HTTPS smoke test"
curl --fail --silent --show-error --max-time 20 "https://${DOMAIN}/" >/dev/null
curl --fail --silent --show-error --max-time 20 "https://api.${DOMAIN}/health" >/dev/null

echo "==> Production deploy complete"
"${COMPOSE[@]}" ps
