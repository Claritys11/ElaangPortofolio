# Elaang Portfolio

Cyberpunk terminal-themed portfolio for CTF write-ups, technical projects, achievements, contact messages, and a private admin dashboard. Built with Next.js 15, React 19, Tailwind CSS, Prisma, and PostgreSQL.

Indonesian documentation: [README.id.md](./README.id.md)

![Portfolio preview](./awd.png)

## Implemented Features

- Public pages for home, about, projects, achievements, CTF write-ups, and contact.
- Dynamic CTF detail pages with slug redirects, metadata, related write-ups, and flag reveal UI.
- Admin inbox at `/inbox` for messages, write-ups, projects, achievements, profile settings, uploads, and access logs.
- Server-side admin sessions using signed HTTP-only cookies.
- PostgreSQL persistence through Prisma migrations.
- Local upload storage under `public/uploads`, served by `/api/public/uploads/:name`.
- Shared accessible cyberpunk loading UI for route transitions, session checks, and dashboard data fetches.
- Genkit AI development files under `src/ai`.

## Storage Modes

The current application runtime uses PostgreSQL through Prisma. Set `DATABASE_URL` and run the Prisma migration before starting the app.

SQLite is supported only as a migration source through `scripts/migrate-sqlite-to-postgres.mjs`; it is not the active runtime database in this branch.

Firebase is not wired as a current runtime mode in this codebase. Do not configure Firebase credentials unless a future change adds and documents that integration.

## Requirements

- Node.js 20.11 or newer
- pnpm 10 or newer, with this repository pinned to `pnpm@11.4.0`
- PostgreSQL database for local or deployed runtime

## Setup

```bash
git clone https://github.com/Claritys11/ElaangPortofolio.git
cd ElaangPortofolio
pnpm install
cp .env.example .env.local
```

Fill `.env.local`:

```env
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="replace-with-a-strong-password"
ADMIN_SESSION_SECRET="use-a-random-string-with-at-least-32-characters"
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

Generate a session secret with:

```bash
openssl rand -base64 48
```

Apply database migrations:

```bash
pnpm db:migrate
```

Run locally:

```bash
pnpm dev
```

The development server runs at `http://localhost:9002`.

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm check
```

`pnpm check` runs the reliable required validations in sequence.

## Admin Usage

1. Start the app.
2. Open `/inbox`.
3. Sign in with `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
4. Manage messages, write-ups, projects, achievements, profile settings, uploads, and audit logs.

Keep admin credentials and `ADMIN_SESSION_SECRET` out of git. Use a non-production database for local development.

## SEO And Site URL

The code includes a fallback base URL in `src/lib/seo-utils.ts` for metadata, robots, sitemap, and write-up URLs. Profile SEO settings can override canonical and preview values from the admin dashboard. Avoid claiming a production domain is final unless the deployment and DNS are verified.

## Project Structure

```text
src/app/                 Next.js App Router pages, loading fallbacks, and API routes
src/components/          Shared UI and portfolio components
src/lib/                 Storage, session, SEO, upload, and type helpers
prisma/                  Prisma schema and PostgreSQL migrations
scripts/                 One-off migration utilities
.github/                 Community files, issue forms, Dependabot, and CI
```

## Contributing

Use fork, branch, commit, push, and Pull Request:

```bash
git checkout -b feat/short-description
pnpm install
pnpm check
git commit -m "feat: describe the change"
git push origin feat/short-description
```

Commits should follow Conventional Commits, such as `feat:`, `fix:`, `docs:`, `chore:`, or `test:`. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Security

Report security issues privately. Do not open public issues for vulnerabilities or include real credentials in reports. See [SECURITY.md](./SECURITY.md).

## License

This repository currently includes the WTFPL license in [LICENSE](./LICENSE).
