# Deploying MOMENT to a VPS

A single Ubuntu VPS running the whole stack via Docker Compose: Postgres, Redis, the API,
the web app, and Caddy as a reverse proxy that auto-provisions Let's Encrypt TLS certs.

No managed database/queue, no CDN, no load balancer — matches ADR-001's "no dedicated ops
headcount" framing. Revisit only once traffic genuinely demands it.

## 1. Provision the server

Any Ubuntu 22.04+ VPS with at least 2GB RAM (DigitalOcean, Hetzner, Linode, etc. all work
identically here — nothing provider-specific). Point two DNS A records at its IP before
continuing:

```
example.com       -> <VPS IP>
api.example.com    -> <VPS IP>
```

Caddy needs both resolving *before* first start, or it can't issue certificates.

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in for the group change to apply
```

## 3. Clone the repo and configure

```bash
git clone <your-repo-url> moment
cd moment
cp .env.production.example .env
nano .env   # fill in DOMAIN, POSTGRES_PASSWORD, JWT_SECRET, and any provider keys you have
```

The stack boots fine with the Stripe/Mux/Twilio keys left blank — those integrations only
error when actually called (see apps/api/README.md). Fill them in whenever you're ready.

## 4. First deploy

```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

This builds the `api` and `web` images, starts the full stack, and runs
`prisma migrate deploy` against the Postgres container. First run also triggers Caddy's
Let's Encrypt certificate issuance for both domains — give it a minute.

Check it's up:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f api
```

Visit `https://example.com`.

## 5. Subsequent deploys

Same command:

```bash
./deploy/deploy.sh
```

It pulls the latest commit, rebuilds both images, restarts the stack, and re-runs
`prisma migrate deploy` (a no-op if there's nothing new to migrate).

## 6. Webhooks

Once you have real Stripe/Mux keys, point their webhook endpoints at:

- Stripe: `https://api.example.com/payments/webhooks/stripe`
- Mux: `https://api.example.com/media/webhooks/mux`

## Rolling back

```bash
git log --oneline -10   # find the commit to roll back to
git checkout <commit>
./deploy/deploy.sh
```

`prisma migrate deploy` only ever applies forward migrations — a schema rollback needs its
own migration, not a git revert. Not a concern yet at Phase 1 (no destructive migrations have
shipped), but worth knowing before this matters.

## What's NOT set up here

Automated backups (Postgres volume is durable but unbackedup — `docker compose exec postgres
pg_dump` on a cron is the minimum viable version), log aggregation/monitoring, and CI
(deploy.sh is run by hand). All reasonable next steps once this is live, not blockers to a
first deploy.
