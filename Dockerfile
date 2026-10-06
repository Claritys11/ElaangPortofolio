# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
# postinstall runs `prisma generate`, which needs a syntactically valid URL but never connects.
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm prisma generate && pnpm build

# Self-contained migrator: pnpm's node_modules are symlinks into its store, so the CLI is installed flat here.
FROM node:24-alpine AS migrate
WORKDIR /opt/migrate
RUN npm init -y >/dev/null && npm install --omit=dev --no-audit --no-fund prisma@7.10.0 dotenv@17
COPY prisma ./prisma
COPY prisma.config.ts ./

# pdf-parse requires @napi-rs/canvas (DOMMatrix polyfill) dynamically, so the tracer misses it.
# Install it flat (musl binary on Alpine); keep the version in sync with pdf-parse's dependency.
FROM node:24-alpine AS native
WORKDIR /opt/native
RUN npm init -y >/dev/null && npm install --omit=dev --no-audit --no-fund @napi-rs/canvas@0.1.80

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN apk add --no-cache su-exec && addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=migrate /opt/migrate /opt/migrate
COPY --from=native /opt/native/node_modules/@napi-rs ./node_modules/@napi-rs
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN mkdir -p public/uploads && chown -R app:app public/uploads
# Starts as root only to fix ownership of the bind-mounted uploads, then drops to `app` (see entrypoint).
EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
