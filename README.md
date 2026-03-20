
# SigmaBangetPortfolioGweh

Cyberpunk-themed personal portfolio to showcase CTF write-ups, projects, achievements, and admin inbox management in one modern dashboard powered by Next.js 15.

> 🇮🇩 Indonesian version: [README.id.md](./README.id.md)

![Portfolio Preview](./Huwutao.jpeg)

## ✨ Highlights

- ⚡ Next.js 15 App Router + React 19 + Tailwind CSS
- 🧠 AI flow support via Genkit (`src/ai`)
- 🗂️ Dual storage mode: `sqlite` or `firebase`
- 🔐 Server-side cookie session for admin dashboard
- 🧾 Public profile data stored in `public/profile.json` (editable from admin)

## 🧱 Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI
- **Backend/API:** Next.js Route Handlers (`src/app/api/**`)
- **Data:** SQLite (`sqlite3`) or Firebase/Firestore
- **Utilities:** date-fns, zod, Genkit

## 🧭 Storage Architecture

| Mode | Best for | Behavior |
|---|---|---|
| `sqlite` | Fast local development | `/api/**` endpoints are active, main data is stored in SQLite, profile remains in `public/profile.json` |
| `firebase` | Firebase/Firestore integration | Browser requests to `/api/**` (non-auth, non-profile) are handled by Firebase client routing; direct calls can return `502` from middleware |

> Recommended path: start with `sqlite` for local setup, then switch to `firebase` once your env is ready.

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

Then fill `.env.local` based on your storage mode.

---

## ⚙️ Environment Configuration

### Option A — SQLite mode (fastest for development)

Use this minimal template:

```env
STORAGE_TYPE="sqlite"
NEXT_PUBLIC_STORAGE_TYPE="sqlite"
SQLITE_DB_PATH="./data/portfolio.sqlite3"

ADMIN_USERNAME="admin"
ADMIN_PASSWORD="replace-with-a-strong-password"
ADMIN_SESSION_SECRET="use-a-random-string-with-at-least-32-characters"
```

Generate a secure secret (example):

```bash
openssl rand -base64 48
```

### Option B — Firebase mode

```env
STORAGE_TYPE="firebase"
NEXT_PUBLIC_STORAGE_TYPE="firebase"

ADMIN_USERNAME="admin"
ADMIN_PASSWORD="must-match-admin-login-and-firebase-fallback"
ADMIN_SESSION_SECRET="use-a-random-string-with-at-least-32-characters"

NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""

NEXT_PUBLIC_FIREBASE_ADMIN_EMAIL=""
FIREBASE_ADMIN_PROJECT_ID=""
FIREBASE_ADMIN_CLIENT_EMAIL=""
FIREBASE_ADMIN_PRIVATE_KEY=""
```

#### Important Firebase notes

- Most secure server-side admin access: provide `FIREBASE_ADMIN_CLIENT_EMAIL` + `FIREBASE_ADMIN_PRIVATE_KEY` (service account).
- If service account variables are empty, the app falls back to Firebase email/password auth using `NEXT_PUBLIC_FIREBASE_ADMIN_EMAIL` + `ADMIN_PASSWORD`.
- In `firebase` mode, non-auth/non-profile API endpoints can return `502` when called directly over network.

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

- Public profile reads from `public/profile.json`
- Changes from the Profile tab are persisted to that file

## 📂 Key Project Structure

```text
src/app/                 # App Router pages + API routes
src/app/api/             # Auth/admin/public/contact endpoints
src/lib/                 # Storage, types, helpers, session
src/firebase/            # Firebase client config/provider
public/profile.json      # Public profile data source
data/portfolio.sqlite3   # SQLite database (in sqlite mode)
```

## 🧯 Troubleshooting

### 1) SQLite native binding issue on install/build

If using `pnpm` and native modules are blocked:

```bash
pnpm approve-builds --all
pnpm install
```

### 2) `ADMIN_SESSION_SECRET must be set and at least 32 characters`

- Ensure `ADMIN_SESSION_SECRET` exists and is at least 32 characters long.

### 3) API returns `502` in Firebase mode

- This is expected for non-auth/non-profile endpoints when called directly.
- From the app UI, those operations are handled via Firebase client routing.

## 📌 Notes

- `NEXT_PUBLIC_NAME`, `NEXT_PUBLIC_EMAIL`, and similar vars are no longer the primary profile source.
- The main profile source is now `public/profile.json`.
