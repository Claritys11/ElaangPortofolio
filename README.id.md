# SigmaBangetPortfolioGweh

Portfolio pribadi bertema cyberpunk untuk menampilkan proyek, write-up CTF, achievement, dan inbox admin dalam satu dashboard modern berbasis Next.js 15.

![Portfolio Preview](./awd.png)

## ✨ Highlight

- ⚡ Next.js 15 App Router + React 19 + Tailwind CSS
- 🧠 AI flow support via Genkit (`src/ai`)
- 🗂️ Mode storage SQLite untuk local maupun server deployment
- 🔐 Admin dashboard dengan cookie session server-side
- 🧾 Profile publik disimpan di `public/profile.json` (editable dari admin)

## 🧱 Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI
- **Backend/API:** Next Route Handlers (`src/app/api/**`)
- **Data:** SQLite (`sqlite3`)
- **Utilities:** date-fns, zod, Genkit

## 🧭 Arsitektur Storage

| Mode | Cocok untuk | Perilaku |
|---|---|---|
| `sqlite` | Local dev paling simpel | API `/api/**` aktif, data utama di SQLite, profile tetap di `public/profile.json` |

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

### Mode SQLite (paling cepat untuk development)

Gunakan template minimal ini:

```env
STORAGE_TYPE="sqlite"
NEXT_PUBLIC_STORAGE_TYPE="sqlite"
SQLITE_DB_PATH="./data/portfolio.sqlite3"

ADMIN_USERNAME="admin"
ADMIN_PASSWORD="ganti-dengan-password-kuat"
ADMIN_SESSION_SECRET="isi-random-string-minimal-32-karakter"
```

Generate secret aman (contoh):

```bash
openssl rand -base64 48
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

- Profile publik dibaca dari `public/profile.json`
- Perubahan dari tab Profile di admin akan langsung menulis file tersebut

## 📂 Struktur Folder Penting

```text
src/app/                 # App Router pages + API routes
src/app/api/             # Endpoint auth/admin/public/contact
src/lib/                 # Storage, types, helper, session
public/profile.json      # Sumber data profile publik
data/portfolio.sqlite3   # Database SQLite (jika mode sqlite)
```

## 🧯 Troubleshooting

### 1) Error SQLite binding saat install/build

Jika pakai `pnpm` dan modul native belum kebuild:

```bash
pnpm approve-builds --all
pnpm install
```

### 2) `ADMIN_SESSION_SECRET must be set and at least 32 characters`

- Pastikan `ADMIN_SESSION_SECRET` ada dan panjangnya minimal 32 karakter.

## 📌 Catatan

- `NEXT_PUBLIC_NAME`, `NEXT_PUBLIC_EMAIL`, dll tidak lagi dipakai sebagai sumber utama profile.
- Sumber profile utama sekarang adalah `public/profile.json`.

