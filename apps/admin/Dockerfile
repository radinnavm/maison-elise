# syntax=docker/dockerfile:1

# Production image for the Maison Élise admin dashboard. Built from the monorepo root:
#   docker build -f apps/admin/Dockerfile --build-arg VITE_API_URL=https://api.example.com/api/v1 -t maison-elise-admin .
#
# VITE_* values are public and baked in at build time. Never pass secrets here.

FROM node:22-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS build
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/admin/package.json apps/admin/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/admin apps/admin

RUN pnpm --filter @maison-elise/shared build \
 && pnpm --filter @maison-elise/admin build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
