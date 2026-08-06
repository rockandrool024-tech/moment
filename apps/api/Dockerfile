# Build context is the repo root (needed for the pnpm workspace):
#   docker build -f apps/api/Dockerfile -t moment-api .
#
# Note: this ships the full node_modules (including devDependencies) into the
# runtime image rather than pruning to production-only. Simpler and more
# reliable than reconciling `pnpm deploy`'s reinstall with Prisma's generated
# client — worth revisiting for image-size optimization once this is a
# concern, not a Phase-1 problem.
FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

COPY apps/api apps/api
RUN pnpm --filter @moment/api prisma:generate
RUN pnpm --filter @moment/api build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json

WORKDIR /repo/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
