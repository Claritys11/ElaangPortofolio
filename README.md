# Claritys — Elang Dimas Syadewa

Personal static site for Elang Dimas Syadewa (**Claritys**): pwn-focused CTF writeups, projects, achievements, and technical profile. Public content is stored as files in this repository and rendered during the build. The local CMS lives in the sibling `RevisionedPortfolioEditor` repository.

## Stack

Next.js 16 static export (App Router) · React 19 · TypeScript · Tailwind CSS 4 + shadcn/ui · GSAP (ScrollTrigger, SplitText, ScrambleText) + Lenis · Markdown/JSON content · Shiki · Vitest · Playwright

## Local development

```bash
pnpm install
pnpm dev                         # Next.js development preview at http://localhost:3007
pnpm build                       # generates static output in dist/
pnpm start                       # serves dist/ at http://127.0.0.1:3100
```

The public site has no database, login, upload endpoint, contact API, or request-time Next.js server. `pnpm start` is a small static file server for local preview; production hosting receives only the contents of `dist/`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Next.js development server on port 3007 |
| `pnpm start` / `pnpm preview:static` | Serves the built `dist/` directory on loopback port 3100 |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm e2e` | Playwright tests against the exported files served without Next.js runtime |
| `pnpm typecheck` / `pnpm lint` | Type and lint checks |
| `pnpm check` | lint + typecheck + unit tests + build |
| `pnpm verify:content` | Validates content schemas, slugs and asset references |
| `pnpm verify:output` | Checks generated routes, sitemap, assets and absence of server/database files |

## Deploy

The `pages.yml` GitHub Actions workflow validates pull requests with lint, typecheck, unit tests, content validation, static export, output verification, and end-to-end tests. Its deploy job is skipped for pull requests and publishes the `dist/` artifact only for pushes to `main`, scheduled refreshes, or manual dispatch. The production site is served entirely from static files.

The GitHub contribution heatmap is fetched during the static build and refreshed by the same workflow every day at 09:23 (`Asia/Jakarta`). `workflow_dispatch` remains available for a manual refresh. This keeps the public site static: no request-time API, database, worker, or GitHub token is required.

### Domain and route configuration

`content/site.json` is the deployment source of truth:

- `url`: canonical HTTP(S) origin only, e.g. `https://claritys.web.id` (no repository path).
- `basePath`: `/` for a custom domain or GitHub Pages user site; `/repository-name` for a project site.
- `outputDirectory`: fixed to `dist`.
- `trailingSlash`, `title`, `description`, and `language`: canonical route and metadata settings.

Next.js `basePath`, public-asset prefixes, metadata, JSON-LD, robots, sitemap, static export scripts, preview server, and GitHub Actions artifact all consume this same configuration. The sitemap includes the six canonical section pages, every published writeup, and each individual project page. Changing `url` does not change DNS or GitHub Pages settings automatically.

The target deployment is `https://claritys.web.id/` with root base path `/`. `CNAME` is emitted into the static artifact for the custom hostname; GitHub Pages' actual custom-domain setting remains a repository setting and DNS must point to GitHub Pages independently.

### Editing content

Run the sibling local editor from `../RevisionedPortfolioEditor`. It reads and writes this repository's `content/` and `public/assets/` directly. There is no second content database. Save changes locally, review the Git diff, then explicitly commit and push. GitHub Actions handles the build and deployment.

### Data migration archive

The old PostgreSQL/Prisma runtime and deployment files have been removed from this public repository. A read-only copy of the old runtime configuration and migration report is retained under the workspace-level `legacy-archive/`; it is not part of this repository or the static output. Do not publish SQL dumps, credentials, private contact messages, access logs, or unreviewed fields from the old system.

## Design rules

The site is editorial first. Large Archivo type, one accent (`#FF5B1F`), mono only for metadata. The security identity shows up in exactly five places and nowhere else:

1. The hero role line decrypts once.
2. Section indexes are hex (`0x01 / about`).
3. Writeup flags are visually redacted until clicked.
4. The nav shows scroll progress as `0x0000 → 0xFFFF`.
5. The footer's giant `ELANG` occasionally glitches into `CLARITYS`. Its timing lives in `src/lib/glitch.ts`.

Every animation is disabled or reduced under `prefers-reduced-motion`, and the article/page content is rendered into HTML at build time rather than requiring a client-side data fetch.

**Flag visibility note:** the reveal mask is presentation only. Published flags are included in the static page payload, the public MDX files, and the Markdown/HTML exports. Do not store operational secrets in this field.
