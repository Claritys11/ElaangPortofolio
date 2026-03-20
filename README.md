
# Elaang's Portfolio

Cyberpunk-themed personal portfolio to showcase CTF write-ups, projects, achievements, and admin inbox management in one modern dashboard powered by Next.js 15.

> 🇮🇩 Indonesian version: [README.id.md](./README.id.md)

![Portfolio Preview](./awd.png)

## ✨ Highlights

- ⚡ Next.js 15 App Router + React 19 + Tailwind CSS
- 🧠 AI flow support via Genkit (`src/ai`)
- 🗂️ Storage runs on Cloudflare D1 only (`PORTFOLIO_DB` binding)
- 🗄️ Media uploads stored in GitHub Releases and served via `/api/public/uploads/:name`
- 🔐 Server-side cookie session for admin dashboard
- 🧾 Profile + SEO settings editable from admin and persisted in storage database

## 🧱 Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI
- **Backend/API:** Next.js Route Handlers (`src/app/api/**`)
- **Data:** Cloudflare D1
- **Asset Storage:** GitHub Releases assets
- **Utilities:** date-fns, zod, Genkit

## 🧭 Storage Architecture

The app runs in Cloudflare-first mode:

- `/api/**` endpoints are active on Next.js/Worker runtime
- main data is stored in Cloudflare D1 (`PORTFOLIO_DB` binding)
- uploads are served through `/api/public/uploads/:name`
- each upload uses a dedicated GitHub release where `tag === filename`

## 🚀 Quick Start

### 1) Prerequisites

- Node.js 18+ (20+ recommended)
- `pnpm` (recommended) or `npm`

### 2) Clone & install

```bash
git clone https://github.com/dfbro/SigmaBangetPortfolioGweh
cd SigmaBangetPortfolioGweh
pnpm install
```

Using npm:

```bash
npm install
```

### 3) Configure environment

```bash
cp .env.example .env.local
```

Then fill the required values in `.env.local`.

---

## ⚙️ Environment Configuration

### Cloudflare D1 + GitHub Releases (required)

Use this template when deploying to Cloudflare Workers:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="replace-with-a-strong-password"
ADMIN_SESSION_SECRET="use-a-random-string-with-at-least-32-characters"

GH_OWNER="your-github-owner"
GH_REPO="your-repo-name"
GH_TOKEN="github-token-with-repo-scope"
```

Important:
- Cloudflare Worker must bind D1 as `PORTFOLIO_DB`.
- Uploads auto-create release tags from file names (`tag === filename`).

Generate a secure secret (example):

```bash
openssl rand -base64 48
```

### Deploy checklist (Cloudflare Worker)

Use environment files by runtime:

- `.env.local` is used by `pnpm dev` (Next.js local dev).
- `.dev.vars` is used by `pnpm preview` / `wrangler dev` (Worker local preview).

Set production secrets in Cloudflare (required):

```bash
pnpm wrangler login
pnpm wrangler secret put ADMIN_USERNAME
pnpm wrangler secret put ADMIN_PASSWORD
pnpm wrangler secret put ADMIN_SESSION_SECRET
pnpm wrangler secret put GH_OWNER
pnpm wrangler secret put GH_REPO
pnpm wrangler secret put GH_TOKEN
```

First-time remote deployment order:

```bash
pnpm d1:create
# copy database_id + preview_database_id into wrangler.jsonc
pnpm d1:setup:remote
pnpm deploy
```

---

## 🏃 Running the Project

### Development

```bash
pnpm dev
```

Runs at:

- http://localhost:9002

### Production build

```bash
pnpm build
pnpm start
```

### Quality checks

```bash
pnpm typecheck
pnpm lint
```

### D1 migration and seed

Initialize Cloudflare D1 (first time only):

```bash
pnpm d1:create
```

Then copy `database_id` and `preview_database_id` from CLI output into `wrangler.jsonc`.

```bash
pnpm d1:migrate:local
pnpm d1:seed:local
```

For remote Cloudflare D1:

```bash
pnpm d1:migrate:remote
pnpm d1:seed:remote
```

### Worker preview and deploy

```bash
pnpm preview
pnpm deploy
```

## 🛠️ Admin Setup & Content Management

After starting the app:

1. Open `/inbox`
2. Sign in with `ADMIN_USERNAME` + `ADMIN_PASSWORD`
3. Manage:
   - Messages
   - Write-ups
   - Projects
   - Achievements
   - Profile (domain, profile photo, about text, philosophy, skills, journey)

### Profile data source

- Public profile reads from `/api/public/profile` (storage-backed)
- Changes from the Profile tab are persisted to storage (`profile_settings`)
- Uploaded images are persisted as GitHub Release assets and proxied by `/api/public/uploads/:name`

## 📂 Key Project Structure

```text
src/app/                 # App Router pages + API routes
src/app/api/             # Auth/admin/public/contact endpoints
src/lib/                 # Storage, types, helpers, session
src/lib/github-release-storage.ts # GitHub release asset helpers
database/migrations/     # D1 schema migrations
database/seeds/          # D1 seed SQL files
```

## 🧯 Troubleshooting

### 1) `Cloudflare D1 binding "PORTFOLIO_DB" is not configured.`

- Ensure `PORTFOLIO_DB` is defined in `wrangler.jsonc`.
- Run `pnpm d1:migrate:local` before first local preview/dev using Worker context.

### 2) `ADMIN_SESSION_SECRET must be set and at least 32 characters`

- Ensure `ADMIN_SESSION_SECRET` exists and is at least 32 characters long.

## 📌 Notes

- `NEXT_PUBLIC_NAME`, `NEXT_PUBLIC_EMAIL`, and similar vars are no longer the primary profile source.
- The main profile source is storage-backed (`profile_settings` table/record).
