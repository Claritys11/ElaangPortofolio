# Elaang Portfolio

Portfolio pribadi bertema terminal cyberpunk untuk write-up CTF, proyek teknis, achievement, pesan kontak, dan dashboard admin privat. Dibangun dengan Next.js 15, React 19, Tailwind CSS, Prisma, dan PostgreSQL.

Dokumentasi bahasa Inggris: [README.md](./README.md)

![Preview portfolio](./awd.png)

## Fitur Yang Sudah Ada

- Halaman publik untuk home, about, projects, achievements, CTF write-ups, dan contact.
- Halaman detail CTF dinamis dengan slug redirect, metadata, related write-ups, dan UI reveal flag.
- Admin inbox di `/inbox` untuk messages, write-ups, projects, achievements, profile settings, uploads, dan access logs.
- Session admin server-side menggunakan signed HTTP-only cookie.
- Persistensi PostgreSQL melalui migrasi Prisma.
- Storage upload lokal di `public/uploads`, disajikan lewat `/api/public/uploads/:name`.
- Loading UI cyberpunk bersama yang accessible untuk route transition, session check, dan fetch data dashboard.
- File pengembangan Genkit AI di `src/ai`.

## Mode Storage

Runtime aplikasi saat ini memakai PostgreSQL melalui Prisma. Isi `DATABASE_URL` dan jalankan migrasi Prisma sebelum menjalankan app.

SQLite hanya didukung sebagai sumber migrasi melalui `scripts/migrate-sqlite-to-postgres.mjs`; SQLite bukan database runtime aktif pada branch ini.

Firebase belum terhubung sebagai mode runtime pada codebase ini. Jangan menambahkan credential Firebase kecuali perubahan mendatang benar-benar menambahkan dan mendokumentasikan integrasi tersebut.

## Kebutuhan

- Node.js 24 atau lebih baru
- pnpm 11.4 atau lebih baru, dengan repository ini dipin ke `pnpm@11.4.0`
- Database PostgreSQL untuk runtime lokal atau deployment

## Setup

```bash
git clone https://github.com/Claritys11/ElaangPortofolio.git
cd ElaangPortofolio
pnpm install
cp .env.example .env.local
```

Isi `.env.local`:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="ganti-dengan-password-kuat"
ADMIN_SESSION_SECRET="isi-random-string-minimal-32-karakter"
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Buat session secret dengan:

```bash
openssl rand -base64 48
```

Jalankan migrasi database:

```bash
pnpm db:migrate
```

Jalankan lokal:

```bash
pnpm dev
```

Development server berjalan di `http://localhost:9002`.

## Validasi

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

`pnpm check` menjalankan validasi wajib yang reliable secara berurutan.

## Penggunaan Admin

1. Jalankan app.
2. Buka `/inbox`.
3. Login dengan `ADMIN_USERNAME` dan `ADMIN_PASSWORD`.
4. Kelola messages, write-ups, projects, achievements, profile settings, uploads, dan audit logs.

Jangan commit credential admin atau `ADMIN_SESSION_SECRET`. Gunakan database non-production untuk development lokal.

## SEO Dan URL Situs

Kode memiliki fallback base URL di `src/lib/seo-utils.ts` untuk metadata, robots, sitemap, dan URL write-up. Profile SEO settings dari dashboard admin dapat mengubah canonical dan preview value. Jangan mengklaim domain production sudah final kecuali deployment dan DNS sudah diverifikasi.

## Struktur Project

```text
src/app/                 Halaman App Router, loading fallback, dan API routes
src/components/          UI bersama dan komponen portfolio
src/lib/                 Helper storage, session, SEO, upload, dan type
prisma/                  Schema Prisma dan migrasi PostgreSQL
scripts/                 Utilitas migrasi one-off
.github/                 Community files, issue forms, Dependabot, dan CI
```

## Kontribusi

Gunakan alur fork, branch, commit, push, dan Pull Request:

```bash
git checkout -b feat/deskripsi-singkat
pnpm install
pnpm check
git commit -m "feat: jelaskan perubahan"
git push origin feat/deskripsi-singkat
```

Commit harus mengikuti Conventional Commits, seperti `feat:`, `fix:`, `docs:`, `chore:`, atau `test:`. Lihat [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Laporkan isu security secara privat. Jangan membuka public issue untuk vulnerability atau menyertakan credential asli dalam laporan. Lihat [SECURITY.md](./SECURITY.md).

## License

Repository ini saat ini memakai license WTFPL di [LICENSE](./LICENSE).
