# syntax=docker/dockerfile:1

# Production image for the Maison Élise API. Built from the monorepo root:
#   docker build -f apps/api/Dockerfile -t maison-elise-api .
#
# The production database (PostgreSQL/Supabase) is external and never containerized.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS build
# Install dependencies against the lockfile first for better layer caching.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/admin/package.json apps/admin/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

RUN pnpm --filter @maison-elise/shared build \
 && pnpm --filter @maison-elise/api prisma:generate \
 && pnpm --filter @maison-elise/api build \
 && pnpm prune --prod

FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Copy only what the compiled server needs (no source, no dev dependencies).
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/public ./apps/api/public
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY --from=build /app/packages/shared/dist ./packages/shared/dist
COPY --from=build /app/packages/shared/package.json ./packages/shared/package.json

# Run as the unprivileged built-in node user.
USER node

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||4000)+'/api/v1/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

WORKDIR /app/apps/api
CMD ["node", "dist/server.js"]
