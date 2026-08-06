# Build context is the repo root (needed for the pnpm workspace):
#   docker build -f apps/web/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=https://api.example.com \
#     --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_... \
#     -t moment-web .
#
# NEXT_PUBLIC_* vars are baked in at build time (Next.js inlines them into
# the client bundle) — they cannot be supplied only at container-run time.
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

RUN pnpm --filter @moment/web build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /repo/apps/web/public ./apps/web/public

EXPOSE 3001
CMD ["node", "apps/web/server.js"]
