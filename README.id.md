# Elaang's Portfolio

Portfolio pribadi bertema cyberpunk untuk menampilkan proyek, write-up CTF, achievement, dan inbox admin dalam satu dashboard modern berbasis Next.js 15.

![Portfolio Preview](./awd.png)

## ✨ Highlight

- ⚡ Next.js 15 App Router + React 19 + Tailwind CSS
- 🧠 AI flow support via Genkit (`src/ai`)
- 🗂️ Storage berjalan Cloudflare D1 saja (`PORTFOLIO_DB` binding)
- 🗄️ Upload media disimpan di GitHub Releases dan disajikan lewat `/api/public/uploads/:name`
- 🔐 Admin dashboard dengan cookie session server-side
- 🧾 Profile + SEO bisa diedit dari admin dan disimpan ke storage database

## 🧱 Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI
- **Backend/API:** Next Route Handlers (`src/app/api/**`)
- **Data:** Cloudflare D1
- **Asset Storage:** GitHub Releases assets
- **Utilities:** date-fns, zod, Genkit

## 🧭 Arsitektur Storage

Aplikasi sekarang berjalan dalam mode Cloudflare-first:

- endpoint `/api/**` aktif di runtime Next.js/Worker
- data utama disimpan di Cloudflare D1 (`PORTFOLIO_DB` binding)
- upload media disajikan lewat `/api/public/uploads/:name`
- setiap upload memakai release GitHub khusus dengan aturan `tag === filename`

## 🚀 Quick Start

### 1) Prasyarat

- Node.js 18+ (disarankan 20+)
- `pnpm` (recommended) atau `npm`

### 2) Clone & install

```bash
git clone https://github.com/dfbro/SigmaBangetPortfolioGweh
cd SigmaBangetPortfolioGweh
pnpm install
```

Alternatif npm:

```bash
npm install
```

### 3) Setup environment

```bash
cp .env.example .env.local
```

Lalu isi `.env.local` dengan nilai yang dibutuhkan.

---

## ⚙️ Setting Environment

### Cloudflare D1 + GitHub Releases (wajib)

Gunakan template ini untuk deployment di Cloudflare Workers:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="ganti-dengan-password-kuat"
ADMIN_SESSION_SECRET="isi-random-string-minimal-32-karakter"

GH_OWNER="github-owner-kamu"
GH_REPO="nama-repo"
GH_TOKEN="github-token-dengan-scope-repo"
```

Catatan penting:
- Worker Cloudflare harus punya binding D1 bernama `PORTFOLIO_DB`.
- Upload otomatis membuat release tag dari nama file (`tag === filename`).

Generate secret aman (contoh):

```bash
openssl rand -base64 48
```

### Checklist deploy (Cloudflare Worker)

Gunakan file environment sesuai runtime:

- `.env.local` dipakai oleh `pnpm dev` (Next.js local dev).
- `.dev.vars` dipakai oleh `pnpm run preview` / `wrangler dev` (preview Worker lokal).

Set secret production di Cloudflare (wajib):

```bash
pnpm wrangler login
pnpm wrangler secret put ADMIN_USERNAME
pnpm wrangler secret put ADMIN_PASSWORD
pnpm wrangler secret put ADMIN_SESSION_SECRET
pnpm wrangler secret put GH_OWNER
pnpm wrangler secret put GH_REPO
pnpm wrangler secret put GH_TOKEN
```

Urutan deploy remote pertama kali:

```bash
pnpm d1:create
# salin database_id + preview_database_id ke wrangler.jsonc
pnpm d1:setup:remote
pnpm run deploy
```

---

## 🏃 Menjalankan Project

### Development

```bash
pnpm dev
```

Server jalan di:

- http://localhost:9002

### Build production

```bash
pnpm build
pnpm start
```

### Quality checks

```bash
pnpm typecheck
pnpm lint
```

### Migrasi dan seed D1

Inisialisasi Cloudflare D1 (sekali saja):

```bash
pnpm d1:create
```

Lalu salin `database_id` dan `preview_database_id` dari output CLI ke `wrangler.jsonc`.

```bash
pnpm d1:migrate:local
pnpm d1:seed:local
```

Untuk Cloudflare D1 remote:

```bash
pnpm d1:migrate:remote
pnpm d1:seed:remote
```

### Preview dan deploy Worker

```bash
pnpm run preview
pnpm run deploy
```

## 🛠️ Admin Setup & Content Setting

Setelah app jalan:

1. Buka `/inbox`
2. Login dengan `ADMIN_USERNAME` + `ADMIN_PASSWORD`
3. Kelola:
   - Messages
   - Write-ups
   - Projects
   - Achievements
   - Profile (termasuk domain, foto profil, about text, philosophy, skill, journey)

### Profile data source

- Profile publik dibaca dari `/api/public/profile` (berbasis storage)
- Perubahan dari tab Profile di admin disimpan ke storage (`profile_settings`)
- Gambar yang di-upload disimpan sebagai GitHub Release asset dan diproxy oleh `/api/public/uploads/:name`

## 📂 Struktur Folder Penting

```text
src/app/                 # App Router pages + API routes
src/app/api/             # Endpoint auth/admin/public/contact
src/lib/                 # Storage, types, helper, session
src/lib/github-release-storage.ts # Helper storage asset GitHub Releases
database/migrations/     # File migrasi skema D1
database/seeds/          # File seed SQL D1
```

## 🧯 Troubleshooting

### 1) `Cloudflare D1 binding "PORTFOLIO_DB" is not configured.`

- Pastikan binding `PORTFOLIO_DB` ada di `wrangler.jsonc`.
- Jalankan `pnpm d1:migrate:local` sebelum preview/dev pertama dengan konteks Worker.

### 2) `ADMIN_SESSION_SECRET must be set and at least 32 characters`

- Pastikan `ADMIN_SESSION_SECRET` ada dan panjangnya minimal 32 karakter.

## 📌 Catatan

- `NEXT_PUBLIC_NAME`, `NEXT_PUBLIC_EMAIL`, dll tidak lagi dipakai sebagai sumber utama profile.
- Sumber profile utama sekarang berbasis storage (`profile_settings`).

