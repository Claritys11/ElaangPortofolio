# Elaang's Portfolio

Portfolio pribadi bertema cyberpunk untuk menampilkan proyek, write-up CTF, achievement, dan inbox admin dalam satu dashboard modern berbasis Next.js 15.

![Portfolio Preview](./awd.png)

## ✨ Highlight

- ⚡ Next.js 15 App Router + React 19 + Tailwind CSS
- 🧠 AI flow support via Genkit (`src/ai`)
- 🗂️ Storage berjalan menggunakan SQLite lokal (`data/portfolio.sqlite3`)
- 🗄️ Upload media disimpan di folder `public/uploads` dan disajikan lewat `/api/public/uploads/:name`
- 🔐 Admin dashboard dengan cookie session server-side
- 🧾 Profile + SEO bisa diedit dari admin dan disimpan ke storage database

## 🧱 Tech Stack

- **Frontend:** Next.js, React, Tailwind CSS, Radix UI
- **Backend/API:** Next Route Handlers (`src/app/api/**`)
- **Data:** SQLite lokal (`data/portfolio.sqlite3`)
- **Asset Storage:** Folder upload lokal (`public/uploads`)
- **Utilities:** date-fns, zod, Genkit

## 🧭 Arsitektur Storage

Aplikasi sekarang berjalan dalam mode server lokal:

- endpoint `/api/**` aktif di runtime Next.js lokal
- data utama disimpan di SQLite lokal (`data/portfolio.sqlite3`)
- upload media disajikan lewat `/api/public/uploads/:name`
- setiap upload disimpan di folder `public/uploads` dan disajikan langsung oleh aplikasi

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

### SQLite lokal + upload folder lokal

Gunakan template ini untuk pengembangan server lokal:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="ganti-dengan-password-kuat"
ADMIN_SESSION_SECRET="isi-random-string-minimal-32-karakter"
```

Catatan penting:
- Data utama disimpan di `data/portfolio.sqlite3`.
- Upload disimpan di `public/uploads` dan disajikan lewat `/api/public/uploads/:name`

Generate secret aman (contoh):

```bash
openssl rand -base64 48
```

### Local development

Jalankan aplikasi secara lokal dengan konfigurasi ini:

```bash
pnpm dev
```

Aplikasi menggunakan SQLite lokal di `data/portfolio.sqlite3` dan upload lokal di `public/uploads`.

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

### Local SQLite Database

Aplikasi ini menggunakan file SQLite lokal untuk pengembangan. File databasenya berada di:

- `data/portfolio.sqlite3`

Wrapper SQLite akan menginisialisasi dan memigrasi skema secara otomatis saat aplikasi berjalan.

### Local development

Jalankan aplikasi secara lokal:

```bash
pnpm dev
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
- Gambar yang di-upload disimpan di folder upload lokal dan diproxy oleh `/api/public/uploads/:name`

## 📂 Struktur Folder Penting

```text
src/app/                 # App Router pages + API routes
src/app/api/             # Endpoint auth/admin/public/contact
src/lib/                 # Storage, types, helper, session
src/lib/upload-storage.ts # Local upload folder helpers
database/migrations/     # SQLite-compatible schema migrations
database/seeds/          # File seed SQL
```

## 🧯 Troubleshooting

### 1) Local SQLite initialization issue

- Pastikan `data/portfolio.sqlite3` dapat ditulis oleh aplikasi.
- Wrapper SQLite akan menginisialisasi skema secara otomatis saat aplikasi berjalan.

### 2) `ADMIN_SESSION_SECRET must be set and at least 32 characters`

- Pastikan `ADMIN_SESSION_SECRET` ada dan panjangnya minimal 32 karakter.

## 📌 Catatan

- `NEXT_PUBLIC_NAME`, `NEXT_PUBLIC_EMAIL`, dll tidak lagi dipakai sebagai sumber utama profile.
- Sumber profile utama sekarang berbasis storage (`profile_settings`).

