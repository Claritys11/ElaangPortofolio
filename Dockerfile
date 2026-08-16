FROM node:24

WORKDIR /app

RUN corepack enable
RUN corepack prepare pnpm@11.4.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --fetch-retries=5 --fetch-timeout=300000 --network-concurrency=8

COPY . .

ARG DATABASE_URL
ARG NEXT_PUBLIC_SITE_URL
ARG SITE_URL
ARG COOLIFY_FQDN

RUN pnpm exec prisma generate

RUN DATABASE_URL="$DATABASE_URL" \
    NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-${SITE_URL:-$COOLIFY_FQDN}}" \
    SITE_URL="${SITE_URL:-${NEXT_PUBLIC_SITE_URL:-$COOLIFY_FQDN}}" \
    COOLIFY_FQDN="$COOLIFY_FQDN" \
    pnpm build

EXPOSE 3000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && pnpm start"]
