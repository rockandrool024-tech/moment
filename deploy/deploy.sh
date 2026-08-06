#!/usr/bin/env bash
# Run from the repo root on the VPS: ./deploy/deploy.sh
set -euo pipefail

if [ ! -f .env ]; then
  echo "Missing .env — copy .env.production.example to .env and fill it in first." >&2
  exit 1
fi

echo "==> Pulling latest code"
git pull --ff-only

echo "==> Building images"
docker compose -f docker-compose.prod.yml build

echo "==> Starting stack"
docker compose -f docker-compose.prod.yml up -d

echo "==> Applying database migrations"
docker compose -f docker-compose.prod.yml exec -T api npx prisma migrate deploy

echo "==> Done. docker compose -f docker-compose.prod.yml logs -f to watch it."
