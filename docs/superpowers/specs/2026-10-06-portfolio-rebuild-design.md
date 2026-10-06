# Portfolio Rebuild — Design Spec

Date: 2026-10-06 · Owner: Elang Dimas Syadewa (Claritys) · Replaces: claritys.web.id (repo `Claritys11/ElaangPortofolio`)

## 1. Intent

The old site (cyberpunk terminal theme: glitch text, TV effect, shell intro) feels AI-generated and not engaging. The new site must feel **hand-made and editorial**, with motion choreography in the spirit of huyml.co, manishkr.xyz, driezie.studio, and ddark.dev. The security identity comes through **small details only**. There is no neon, matrix rain, or glitch.

Success looks like this:
- Visitors immediately read "Elang: pwn-focused CTF player and builder", then browse writeups.
- All existing content (39 writeups, 4 projects, 28 achievements, profile, 386 messages, 80 access logs, 195 uploaded files) works unchanged after `pg_restore` and extracting the uploads.
- Elang can keep publishing through `/admin` with the same capabilities as today.

Decisions already made by the user:
- Scope: the public site **and** a port of the admin dashboard.
- Aesthetic: "editorial + subtle hacker".
- **Pwn is the headline expertise**, not stego.
- Contact form lives inside the footer flow.
- The provided `CinematicFooter` is integrated and adapted.

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, RSC), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york, CSS-variable tokens). `components/ui` is the shadcn path. |
| Motion | GSAP 3 + ScrollTrigger + SplitText, Lenis smooth scroll (synced to the GSAP ticker) |
| DB | PostgreSQL 18 via Prisma, **schema identical to old tables/columns** |
| Auth | Signed HTTP-only cookie session (HMAC, `ADMIN_SESSION_SECRET`), env credentials; logic ported from old `lib/session.ts` |
| Editor | Tiptap (writeup HTML stays Tiptap-compatible) |
| Icons | lucide-react |
| Package manager | pnpm |
| Deploy | Dockerfile (standalone output), docker-compose with app + postgres; works on Coolify as before |

## 3. Data Compatibility (hard constraints)

- The Prisma models keep exact table and column names: `writeups`, `projects`, `achievements`, `secure_messages`, `access_logs`, `profile_settings`, and fields like `tags_json`, `attachments_json`, `proof_score`.
- Existing `_prisma_migrations` (`20260725150000_init_postgres`, `20260825083000_add_achievement_proof_score`) are carried over as baseline migrations, so `prisma migrate deploy` is a no-op on the restored DB. The extra index `idx_writeups_slug` is a **partial unique index** (`UNIQUE (slug) WHERE slug IS NOT NULL`, created outside migrations in prod). It is declared in the schema via `@unique(map: "idx_writeups_slug", where: raw("(slug IS NOT NULL)"))` (preview feature `partialIndexes`) and added by a new idempotent migration `CREATE UNIQUE INDEX IF NOT EXISTS`.
- Writeup `content` is HTML with `<img src="/api/public/uploads/...">`. The route **`/api/public/uploads/[name]`** is kept with identical semantics: it streams from `public/uploads`, guards against path traversal, and sets content-type from the extension, defaulting to `application/octet-stream` as a download.
- Image fields can be `/api/public/uploads/...`, `/profile.jpg`, or `data:image/...;base64`. One shared `<Media>` component handles all three.
- `attachments_json` items are `{url, name, contentType}`.
- Old URLs redirect permanently (308): `/ctf` → `/writeups` and `/ctf/:id` → `/writeups/:slug`. `:id` may be a uuid or a slug and resolves either way, as before.

## 4. Visual System

- **Palette:** a paper-and-ink pair (`#0E0E0C` ink / `#EDEBE6` paper) with dark as the default, plus a light theme. There is one accent, **signal orange `#FF5B1F`**, used sparingly for focus, active state, and one word per section at most. Tokens are defined as shadcn CSS variables in oklch, so the footer's `color-mix(in oklch, var(--foreground) …)` works natively.
- **Type:** *Archivo* (variable, `wdth` axis) for display: huge, tight tracking, condensed↔expanded width animated on scroll. *Inter Tight* for body. *Geist Mono* is used only for metadata (dates, indexes `0x01`, tags, counters). The footer uses the site fonts instead of Plus Jakarta Sans.
- **Layout:** 12-column grid, generous whitespace, hairline rules (`1px` at 10% foreground), numbered section indexes in mono.
- **"Hacker" details (the full list, nothing more):**
  1. Hero role line `pwn · rev · forensics` decrypts once from random glyphs on load.
  2. Section indexes in hex (`0x01 / work`).
  3. The flag in a writeup is redacted (`█████`) until clicked.
  4. A mono address-style counter in the nav shows scroll progress as `0x0000 → 0xFFFF`.
  5. **The only glitch on the site:** the footer's giant `ELANG` briefly glitches into `CLARITYS` (see §7). Its rarity is what makes it land.
- **Motion rules:** every animation explains structure (reveal, pin, scrub). No ambient decoration except in the footer. Under `prefers-reduced-motion`, Lenis is disabled, SplitText reveals become instant fades, and pins become static sections.

## 5. Public Information Architecture

### `/` Home (long scroll)
1. **Hero:** full-viewport name `ELANG DIMAS SYADEWA` split into characters that rise in a stagger. The alias `Claritys` and the decrypting role line sit beneath, with a small mono block on the right: `based in Malang, ID / SMK Telkom Malang / available for CTF teams`.
2. **0x01 / about-short:** two-sentence intro, with key words revealed word by word on scroll scrub, and a portrait with a clip-path reveal.
3. **0x02 / writeups:** a numbered index list of the latest 8 writeups (`01 ── Truman ── PWN · Medium ── SCTF 2026`). On hover a floating preview card follows the cursor with the cover image. A stats row shows a count-up per category (Pwn 23, Forensics 11, …). Links to `/writeups`.
4. **0x03 / projects:** pinned horizontal scroll of project panels (image, title, category, tags, link).
5. **0x04 / record:** achievements as a vertical timeline grouped by year, with items that have the highest `proof_score` set larger. Links to `/achievements`.
6. **Quote interlude:** the philosophy text set huge, words fading in on scrub.
7. **Contact + CinematicFooter** (see §7).

### `/writeups`
Filter chips for category (Pwn first) and competition, plus text search (client-side over the list; 39 items). The index-list style matches home.

### `/writeups/[slug]`
Header with category, difficulty, competition, date, and tags. Article body is the Tiptap HTML rendered with typography styles, Shiki-highlighted code blocks (HTML is sanitized server-side), a sticky TOC from h2/h3, an attachments list, the flag reveal, and prev/next links within the same category. `generateMetadata` + JSON-LD `TechArticle`.

### `/projects`
Grid of the 4 projects, larger cards, plus a detail modal or external link.

### `/achievements`
Full timeline grouped by year, with a filter (all / competitions / learning; `platform` is too sparse in the data to filter on) and a certificate image lightbox.

### `/about`
The about text, journey timeline (`professional_journey_json`), skills (rendered sorted by level, with **Binary Exploitation / Pwn pinned first** in the UI regardless of stored order), education, and links.

### Global
- Nav: brand (`navbar_brand_name` when mode=`custom`), links, theme toggle, scroll counter.
- Page transitions: a short ink-panel wipe (pure CSS keyframes in the route `template.tsx`, so it works without JS and is disabled under reduced motion).
- `sitemap.ts`, `robots.ts`, OG images from SEO settings, and `seo_settings_json` used for metadata and Person JSON-LD.
- Data is fetched in Server Components through Prisma (`lib/data/*`), deduped per request with React `cache()`. DB-backed pages use `export const dynamic = "force-dynamic"`, so `next build` never needs a database (the Docker build has none) and admin edits show up immediately. The data set is tiny (<500 rows), so per-request queries are cheap.

## 6. Admin (`/admin`)

This is functional shadcn UI with no scroll theatrics. It uses the same theme tokens.
- `/admin/login`: env credentials, with each attempt written to `access_logs` (username, success, IP). Rate-limited in memory to 5 attempts per 10 minutes per IP.
- Middleware protects `/admin/*` and `/api/admin/*` by verifying the signed cookie.
- Sections: **Dashboard** (counts, latest messages), **Writeups** (list, create/edit with Tiptap including image upload, tags, attachments, flag, slug, and **PDF import** ported from old `import-pdf` route), **Projects**, **Achievements** (incl. proof_score), **Profile** (all profile_settings fields including JSON editors for arsenal/journey/education/SEO as structured forms), **Messages** (list, read, delete, bulk delete), **Access logs** (read-only), and **Uploads** (upload, list, delete).
- Uploads are saved as `<uuid>-<sanitized-name>` in `public/uploads`, with size limit and type allow-list ported from old `upload-storage.ts`.
- Mutations go through Route Handlers under `/api/admin/*` (or Server Actions) with zod validation.

## 7. CinematicFooter Integration

- The file is `components/ui/motion-footer.tsx`, keeping the structure from the user-provided component (curtain clip-path wrapper, fixed footer, GSAP parallax giant text, staggered reveal, MagneticButton, marquee, aurora, grid).
- Hard-coded content is replaced with props/data:
  - Giant text: `ELANG`, with a **glitch foreshadow to `CLARITYS`**:
    - **Trigger:** once when the footer finishes its reveal (ScrollTrigger `onEnter` at the end of the parallax), then at random intervals of 7–12 s while the footer is in view. The timer pauses when the footer is offscreen or the tab is hidden.
    - **Sequence (~450 ms, GSAP timeline):**
      1. 2–3 horizontal slice offsets (clip-path `inset` bands shifting ±2–4vw).
      2. An RGB split (two pseudo-layers in accent orange and foreground at low opacity, offset ±0.4vw).
      3. The word swaps to `CLARITYS` for ~180 ms, then glitches back to `ELANG`.
    - **Width:** `CLARITYS` is 8 characters against `ELANG`'s 5, so it renders on the Archivo `wdth` axis condensed (and `scaleX` fallback) to occupy the same box. There's no layout shift and no overflow.
    - **Accessibility:** the giant text is `aria-hidden`, and the swap layer is decorative. Under `prefers-reduced-motion` there are no slices or RGB split; it does a single 300 ms crossfade ELANG→CLARITYS→ELANG once on enter.
    - It's implemented as a small `GlitchSwap` component inside the footer file, so it's testable in isolation (props: `primary`, `secret`, `minDelay`, `maxDelay`).
  - Marquee: `PWN ✦ REVERSE ✦ FORENSICS ✦ CRYPTO ✦ WEB ✦ SCTF 2026 ✦ BeeCTF 2026 ✦ …` (categories + competitions from DB).
  - Heading: "Got a binary for me?"
  - Primary pills: **GitHub**, **Email**. Secondary pills: Instagram, Writeups, Back home.
  - Bottom: `© 2026 Elang Dimas Syadewa`, "Crafted with ♥ by Claritys", back-to-top.
- The App Store/Play icons are replaced with lucide icons. The Plus Jakarta Sans import is removed.
- Back-to-top uses `lenis.scrollTo(0)` when Lenis is active.
- Fix in the integration: the demo has typos (`bg-background]`, `shadow-m]`); the main content above the footer must have `relative z-10 bg-background` so the curtain reveal works.
- On mobile, the giant text and marquee scale down, pills wrap, and the footer height becomes `min-h-svh`.
- The **contact form** is a section immediately before the footer: name, email/handle, message, plus a hidden honeypot field. It POSTs to `/api/contact`, which validates with zod, rate-limits to 3 per 10 minutes per IP, and writes to `secure_messages` (`source: "contact-form"`).

## 8. Error Handling

- DB unavailable on public pages: render an error boundary with a plain "content unavailable" state; never expose stack traces.
- 404 for unknown slugs and a custom `not-found` page in the site style.
- Upload route: 404 for missing files, 400 for invalid names.
- Admin API: 401 without session, 422 with zod field errors, and toasts in the UI.

## 9. Testing & Verification

- `pnpm typecheck`, `pnpm lint`, `pnpm build` must pass.
- Unit tests (Vitest) for pure logic: session sign/verify, slug/uuid resolution, upload filename sanitization, HTML sanitization, rate limiter.
- Playwright smoke against the restored DB: home renders with real writeup titles, the `/writeups/pwn-truman` image loads from `/api/public/uploads`, `/ctf/pwn-truman` redirects, the contact form submits and the honeypot rejects, admin login → create/edit/delete project → log entry exists, and pages pass with reduced motion.
- Manual: screenshots at 390px and 1440px for each public page.

## 10. Out of Scope

Genkit AI files, GitHub contributions widget, i18n, and multi-user admin.

## 11. Local Dev Environment

A dedicated container `newportfolio-db` (postgres:18-alpine, `127.0.0.1:5436`) holds the restored dump. Uploads are extracted to `public/uploads` (gitignored). Backups (`*.dump`, `*.tar.gz`) stay in the repo root, gitignored.
