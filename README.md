
# Elaang's Portfolio

Cyberpunk-themed personal portfolio to showcase CTF write-ups, projects, achievements, and admin inbox management in one modern dashboard powered by Next.js 15.

> 🇮🇩 Indonesian version: [README.id.md](./README.id.md)

![Portfolio Preview](./awd.png)

## ✨ Highlights

- ⚡ Next.js 15 App Router + React 19 + Tailwind CSS
- 🧠 AI flow support via Genkit (`src/ai`)
- 🗂️ Storage runs on local SQLite (`data/portfolio.sqlite3`)
- 🗄️ Media uploads stored in the local `public/uploads` folder and served via `/api/public/uploads/:name`
- 🔐 Server-side cookie session for admin dashboard
- 🧾 Profile + SEO settings editable from admin and persisted in storage database

## 🧱 Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI
- **Backend/API:** Next.js Route Handlers (`src/app/api/**`)
- **Data:** Local SQLite (`data/portfolio.sqlite3`)
- **Asset Storage:** Local uploads folder (`public/uploads`)
- **Utilities:** date-fns, zod, Genkit

## 🧭 Storage Architecture

The app runs in local server mode:

- `/api/**` endpoints are active on the local Next.js server
- main data is stored in local SQLite (`data/portfolio.sqlite3`)
- uploads are served through `/api/public/uploads/:name`
- uploaded files are stored in `public/uploads` and served directly from the app

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

### Local SQLite + local uploads

Use this template for local server development:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="replace-with-a-strong-password"
ADMIN_SESSION_SECRET="use-a-random-string-with-at-least-32-characters"
```

Important:
- Main data is persisted to `data/portfolio.sqlite3`.
- Uploads are stored in `public/uploads` and served from `/api/public/uploads/:name`.

Generate a secure secret (example):

```bash
openssl rand -base64 48
```

### Local development notes

Use `.env.local` only for local admin credentials and run the app with:

```bash
pnpm dev
```

The local SQLite database file is created at `data/portfolio.sqlite3`, and uploads are stored in `public/uploads`.

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

### Local SQLite Database

This project uses a local SQLite file for development. The database file is stored at:

- `data/portfolio.sqlite3`

The SQLite wrapper automatically initializes and migrates the schema when the app starts.

### Local development

This branch is intended for local server deployment using Next.js.

```bash
pnpm dev
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
- Uploaded images are stored in the local uploads folder and proxied by `/api/public/uploads/:name`

## 📂 Key Project Structure

```text
src/app/                 # App Router pages + API routes
src/app/api/             # Auth/admin/public/contact endpoints
src/lib/                 # Storage, types, helpers, session
src/lib/upload-storage.ts   # Local upload folder helpers
database/migrations/     # SQLite-compatible schema migrations
database/seeds/          # Seed SQL files
```

## 🧯 Troubleshooting

### 1) Local SQLite initialization issue

- Ensure `data/portfolio.sqlite3` is writable by the app.
- The SQLite wrapper should initialize the schema automatically on startup.

### 2) `ADMIN_SESSION_SECRET must be set and at least 32 characters`

- Ensure `ADMIN_SESSION_SECRET` exists and is at least 32 characters long.

## 📌 Notes

- `NEXT_PUBLIC_NAME`, `NEXT_PUBLIC_EMAIL`, and similar vars are no longer the primary profile source.
- The main profile source is storage-backed (`profile_settings` table/record).
