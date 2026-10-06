# Claritys — Elang Dimas Syadewa

Personal site for Elang Dimas Syadewa (**Claritys**): pwn-focused CTF writeups, projects, a competition record, and a private admin to publish all of it. This rebuild replaces the old cyberpunk/terminal portfolio with an editorial layout and GSAP scroll choreography, and reads the **same PostgreSQL data** as before.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui · GSAP (ScrollTrigger, SplitText, ScrambleText) + Lenis · Prisma 7 + PostgreSQL 18 · Tiptap 3 · Vitest · Playwright

## Local development

```bash
# 1. Database (any Postgres 16+ works; this is the one used in development)
docker network create newportfolio_default
docker run -d --name newportfolio-db --network newportfolio_default \
  -e POSTGRES_USER=portfolio -e POSTGRES_PASSWORD=portfolio -e POSTGRES_DB=portfolio \
  -p 127.0.0.1:5436:5432 -v newportfolio-pgdata:/var/lib/postgresql postgres:18-alpine

# 2. Restore a backup (optional) and the uploads that its content references
docker cp portfolio-YYYY-MM-DD.dump newportfolio-db:/tmp/d.dump
docker exec newportfolio-db pg_restore -U portfolio -d portfolio --no-owner --no-acl /tmp/d.dump
mkdir -p public && tar xzf uploads-YYYY-MM-DD.tar.gz -C public

# 3. App
pnpm install
cp .env.example .env.local     # set ADMIN_PASSWORD and ADMIN_SESSION_SECRET (openssl rand -base64 48)
pnpm db:migrate
pnpm dev                        # http://localhost:3007
```

Use a user-defined Docker network (as above): on some hosts the default `docker0` bridge is not reachable from the host.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Dev server on port 3007 |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm e2e` | Playwright tests against a production build on port 3100 (needs the dev DB) |
| `pnpm typecheck` / `pnpm lint` | Type and lint checks |
| `pnpm check` | lint + typecheck + unit tests + build |
| `pnpm db:migrate` | `prisma migrate deploy` |

## Deploy

### Docker Compose

```bash
cp .env.example .env.production   # fill ADMIN_*, NEXT_PUBLIC_SITE_URL=https://claritys.web.id
export POSTGRES_PASSWORD=...      # or put it in a .env next to docker-compose.yml
scripts/restore.sh portfolio-YYYY-MM-DD.dump uploads-YYYY-MM-DD.tar.gz   # first deploy only
docker compose up -d --build
```

The app listens on `127.0.0.1:3020`. Put a reverse proxy in front of it. The container runs `prisma migrate deploy` on start.

### Coolify

Build from the `Dockerfile`, set the variables from `.env.example`, and mount a persistent volume at `/app/public/uploads`. Coolify's Traefik is one proxy hop, so keep `TRUSTED_PROXY_HOPS=1`.

## Admin

`/admin` signs in with `ADMIN_USERNAME` / `ADMIN_PASSWORD`, and the session lasts 8 hours. Every attempt lands in **Access logs**, and logins are rate-limited to 5 per 10 minutes per IP. From the admin you can manage writeups (rich editor, PDF/Notion import, attachments, flag), projects, achievements, profile and SEO, contact messages, and uploads.

## Design rules

The site is editorial first. Large Archivo type, one accent (`#FF5B1F`), mono only for metadata. The security identity shows up in exactly five places and nowhere else:

1. The hero role line decrypts once.
2. Section indexes are hex (`0x01 / about`).
3. Writeup flags are redacted until clicked.
4. The nav shows scroll progress as `0x0000 → 0xFFFF`.
5. The footer's giant `ELANG` occasionally glitches into `CLARITYS`. Its timing lives in `src/lib/glitch.ts`.

Every animation is disabled or reduced under `prefers-reduced-motion`, and content is never hidden when JavaScript is unavailable.
