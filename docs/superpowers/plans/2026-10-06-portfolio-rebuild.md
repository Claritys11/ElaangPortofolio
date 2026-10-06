# Portfolio Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild claritys.web.id as an editorial, GSAP-choreographed Next.js 16 site plus a ported admin dashboard, reading the existing Postgres data unchanged.

**Architecture:** Single Next.js 16 App Router app. Public pages are Server Components that query Prisma (`lib/data/*`), rendered dynamically. Client "motion islands" (`components/motion/*`) add GSAP/Lenis behaviour on top of server-rendered, fully readable HTML. The admin lives under `/admin`, uses Server Actions guarded by a signed-cookie session, and `proxy.ts` gates routes.

**Tech Stack:** Next.js 16.3, React 19.3, TypeScript strict, Tailwind CSS 4.3, shadcn (CLI 4), GSAP 3.15 (+ScrollTrigger, SplitText, ScrambleTextPlugin), @gsap/react 2, Lenis 1.3, Prisma 7.10 (`prisma-client` generator + `@prisma/adapter-pg`), PostgreSQL 18, zod 4, unified/rehype + @shikijs/rehype, Tiptap 3, Vitest 5, Playwright 1.63, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-06-portfolio-rebuild-design.md`

## Global Constraints

- DB table/column names are exactly the legacy ones (`writeups`, `projects`, `achievements`, `secure_messages`, `access_logs`, `profile_settings`; `tags_json`, `attachments_json`, `proof_score`, `image_url`, …). Never rename or drop.
- `prisma migrate deploy` must be a no-op against the restored dump, except the idempotent partial-index migration.
- `GET /api/public/uploads/[name]` must keep legacy semantics: files from `public/uploads`, 400 on invalid names, 404 when missing, inline `Content-Disposition`.
- Old URLs: `/ctf` → `/writeups` and `/ctf/:idOrSlug` → `/writeups/:slug`, permanent (308).
- Legacy hosts (`clarityz.my.id`, `www.clarityz.my.id`, `claritys.my.id`, `www.claritys.my.id`, `portf.claritys.my.id`) redirect 308 to `https://claritys.web.id`.
- DB-backed pages export `const dynamic = "force-dynamic"`. `next build` must succeed with **no** database reachable.
- Palette: ink `#0E0E0C`, paper `#EDEBE6`, accent signal orange `#FF5B1F`. Dark is the default theme.
- Fonts: Archivo (display, `wdth` axis), Inter Tight (body), Geist Mono (metadata only). No Plus Jakarta Sans anywhere.
- "Hacker" details are only these: (1) hero role line decrypts once, (2) hex section indexes `0x01 / …`, (3) flag redacted until click, (4) nav scroll counter `0x0000→0xFFFF`, (5) footer `ELANG`→`CLARITYS` glitch. Nothing else glitches, scrambles, or glows.
- Pwn is the headline expertise: hero role line reads `pwn · rev · forensics`, and in skill/category lists Pwn / Binary Exploitation is always first.
- Every animation is skipped or reduced under `prefers-reduced-motion: reduce`. Content is never left at `opacity: 0` when JS is off or the motion is reduced.
- Contact messages are stored as `title = subject || "Message from <name>"`, `content = "From: <name> (<contact>)\n\n<message>"`, `username = name`, `source = "contact-form"` (legacy format).
- Package manager: pnpm. Dev DB: `postgresql://portfolio:portfolio@127.0.0.1:5436/portfolio` (container `newportfolio-db` on network `newportfolio_default`, already restored). **Shell note:** this host's sandbox blocks loopback TCP. Commands that hit the DB or a local dev server need the sandbox disabled.
- Legacy source for porting: `.legacy/` (gitignored copy of the old repo).
- Commit trailer on every commit: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`

## Review Focus

1. **Sparse legacy rows:** writeups with `slug`, `title`, `date` or `category` NULL. Expect links to fall back to `id`, "Untitled", "Undated", and category "Misc". Pinned in Task 3 (mapper tests) and Task 11 (route resolves by id).
2. **Hostile upload names:** `..%2Fetc%2Fpasswd`, `a/b`, `\x00`, empty, and names over 255 chars. Expect 400 and never a filesystem read outside `public/uploads`. Pinned in Task 4.
3. **Contact spam:** a filled honeypot gets a 201-looking success but nothing is stored; the 4th post from one IP within 10 min gets 429; oversize message gets 422. Pinned in Task 9.
4. **Reduced motion / no-JS:** every section is readable and visible, with nothing stuck at opacity 0 and no pinned scroll trap. Pinned in Task 7 (unit test of the motion gate) and Task 18 (Playwright with `reducedMotion: 'reduce'`).
5. **Malformed JSON columns:** `tags_json` that is not an array, contains non-strings, or `{}`; and `technical_arsenal_json` entries missing `level`. Expect a defensive parse to empty/filtered values and no crash. Pinned in Task 2 (`json.ts` tests).

---

## File Structure

```
.
├── prisma.config.ts                      # Prisma 7 config (schema path, migrations, datasource url)
├── prisma/schema.prisma                  # camelCase models @map'd to legacy snake_case
├── prisma/migrations/                    # 2 legacy migrations (byte-identical) + partial index
├── next.config.ts                        # standalone output, /ctf redirect
├── src/proxy.ts                          # legacy host redirect, /admin gate, noindex header
├── src/app/
│   ├── layout.tsx                        # fonts, ThemeProvider, Toaster
│   ├── globals.css                       # Tailwind v4 + tokens (oklch) + prose styles
│   ├── not-found.tsx, global-error.tsx
│   ├── sitemap.ts, robots.ts
│   ├── (site)/layout.tsx                 # SmoothScroll, Nav, <main> curtain, Contact, Footer
│   ├── (site)/error.tsx
│   ├── (site)/page.tsx                   # home
│   ├── (site)/writeups/page.tsx, writeups/[slug]/page.tsx
│   ├── (site)/projects/page.tsx, achievements/page.tsx, about/page.tsx
│   ├── ctf/page.tsx, ctf/[id]/page.tsx   # permanent redirects
│   ├── admin/login/page.tsx
│   ├── admin/(panel)/layout.tsx          # session check + sidebar
│   ├── admin/(panel)/page.tsx            # dashboard
│   ├── admin/(panel)/{writeups,projects,achievements}/{page,new/page,[id]/page}.tsx
│   ├── admin/(panel)/{profile,messages,logs,uploads}/page.tsx
│   └── api/
│       ├── public/uploads/[name]/route.ts
│       ├── contact/route.ts
│       ├── auth/login/route.ts, auth/logout/route.ts
│       ├── admin/upload/route.ts, admin/upload/[name]/route.ts
│       └── admin/writeups/import-pdf/route.ts
├── src/lib/
│   ├── utils.ts                          # cn (shadcn)
│   ├── db.ts                             # PrismaClient singleton
│   ├── json.ts                           # defensive JSON column parsers
│   ├── types.ts                          # domain types used by UI
│   ├── data/{profile,writeups,projects,achievements,mappers}.ts
│   ├── uploads.ts                        # name validation, mime, read/write/delete
│   ├── session.ts                        # HMAC cookie session
│   ├── rate-limit.ts                     # in-memory fixed window
│   ├── request.ts                        # clientIp(headers)
│   ├── html.ts                           # rehype pipeline: sanitize, slug, toc, shiki
│   ├── contact.ts                        # zod schema + message formatting
│   ├── motion.ts                         # gsap registration + prefersReducedMotion
│   ├── glitch.ts                         # pure helpers for GlitchSwap
│   └── admin/{guard,schemas}.ts, admin/actions/*.ts
├── src/components/
│   ├── ui/                               # shadcn primitives + motion-footer.tsx
│   ├── motion/{smooth-scroll,reveal,split-heading,scramble-line,scroll-counter,page-transition}.tsx
│   ├── site/{nav,theme-toggle,media,hero,about-short,writeup-index,hover-preview,category-stats,project-rail,record-timeline,quote,contact-section,flag-reveal,toc,section-label,writeup-filter,achievement-list}.tsx
│   └── admin/{sidebar,rich-editor,image-field,tags-field,delete-button,data-table,login-form,pdf-import}.tsx
├── tests/unit/*.test.ts                  # Vitest
├── e2e/*.spec.ts                         # Playwright
├── Dockerfile, docker-compose.yml, .env.example, README.md
```

---

### Task 1: Scaffold the app, theme tokens and test runner

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `components.json`, `vitest.config.ts`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/(site)/page.tsx` (temporary), `src/lib/utils.ts`, `.env.example`, `.env.local`
- Test: `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces: `cn(...classes)` from `@/lib/utils`. CSS tokens `--background --foreground --primary --secondary --muted --muted-foreground --border --destructive --accent --ring` (oklch), and font CSS vars `--font-display --font-sans --font-mono` exposed as Tailwind `font-display font-sans font-mono`. `@` alias → `src/`.

- [ ] **Step 1: Generate the Next app into a temp dir and move it in** (the project root already has files, so create-next-app can't target it directly)

```bash
cd /home/claritys/homelab/newportfolio
pnpm create next-app@16 .scaffold --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --turbopack --no-react-compiler --yes
rsync -a --exclude .git --exclude README.md --exclude .gitignore .scaffold/ ./ && rm -rf .scaffold
pnpm pkg set name=claritys-portfolio
```

- [ ] **Step 2: Init shadcn and add primitives used across the site and admin**

```bash
pnpm dlx shadcn@latest init --base-color neutral --yes
pnpm dlx shadcn@latest add button input textarea label select switch tabs table dialog alert-dialog dropdown-menu badge card separator sonner tooltip skeleton sheet scroll-area --yes
```
If the CLI rejects these flags, run `pnpm dlx shadcn@latest init --help` and choose: style new-york (or the CLI default), base colour neutral, CSS variables on. The tokens are overwritten in Step 4 anyway.
Expected: `components.json` has `"aliases": {"components": "@/components", "ui": "@/components/ui", ...}`, and `src/lib/utils.ts` exports `cn`.

- [ ] **Step 3: Install runtime and dev deps**

```bash
pnpm add gsap @gsap/react lenis next-themes zod @prisma/client@7 @prisma/adapter-pg@7 pg unified rehype-parse rehype-sanitize rehype-slug rehype-stringify @shikijs/rehype shiki hast-util-to-string unist-util-visit lucide-react
pnpm add -D prisma@7 vitest @vitejs/plugin-react vite-tsconfig-paths @types/pg @playwright/test tsx dotenv
```

- [ ] **Step 4: Replace `src/app/globals.css` with the token system**

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  /* light = paper */
  --background: oklch(0.935 0.006 85);      /* #EDEBE6 */
  --foreground: oklch(0.17 0.004 100);      /* #0E0E0C */
  --card: oklch(0.955 0.005 85);
  --card-foreground: var(--foreground);
  --popover: var(--card);
  --popover-foreground: var(--foreground);
  --primary: oklch(0.68 0.2 38);            /* #FF5B1F signal orange */
  --primary-foreground: oklch(0.17 0.004 100);
  --secondary: oklch(0.88 0.006 85);
  --secondary-foreground: var(--foreground);
  --muted: oklch(0.9 0.005 85);
  --muted-foreground: oklch(0.45 0.005 90);
  --accent: var(--primary);
  --accent-foreground: var(--primary-foreground);
  --destructive: oklch(0.58 0.21 27);
  --border: oklch(0.17 0.004 100 / 12%);
  --input: oklch(0.17 0.004 100 / 18%);
  --ring: var(--primary);
  --radius: 0.375rem;
}

.dark {
  --background: oklch(0.17 0.004 100);      /* ink */
  --foreground: oklch(0.935 0.006 85);      /* paper */
  --card: oklch(0.2 0.004 100);
  --card-foreground: var(--foreground);
  --popover: var(--card);
  --popover-foreground: var(--foreground);
  --primary: oklch(0.68 0.2 38);
  --primary-foreground: oklch(0.17 0.004 100);
  --secondary: oklch(0.26 0.004 100);
  --secondary-foreground: var(--foreground);
  --muted: oklch(0.23 0.004 100);
  --muted-foreground: oklch(0.68 0.006 85);
  --accent: var(--primary);
  --accent-foreground: var(--primary-foreground);
  --destructive: oklch(0.62 0.21 27);
  --border: oklch(0.935 0.006 85 / 12%);
  --input: oklch(0.935 0.006 85 / 18%);
  --ring: var(--primary);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --font-display: var(--font-archivo);
  --font-sans: var(--font-inter-tight);
  --font-mono: var(--font-geist-mono);
}

@layer base {
  * { @apply border-border outline-ring/50; }
  html { -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  body { @apply bg-background text-foreground font-sans; }
  ::selection { background: var(--primary); color: var(--primary-foreground); }
}

/* Lenis */
html.lenis, html.lenis body { height: auto; }
.lenis.lenis-smooth { scroll-behavior: auto !important; }
.lenis.lenis-stopped { overflow: hidden; }

/* mono metadata helper */
.meta { @apply font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground; }
```

If `tw-animate-css` was not installed by shadcn init, run `pnpm add tw-animate-css`.

- [ ] **Step 5: Root layout with fonts and theme** (`src/app/layout.tsx`)

```tsx
import type { Metadata } from "next";
import { Archivo, Inter_Tight, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: { default: "Elang Dimas Syadewa — Claritys", template: "%s — Claritys" },
  description: "Pwn-focused CTF player and builder from Malang, Indonesia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${archivo.variable} ${interTight.variable} ${geistMono.variable}`}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

Delete the scaffold's `src/app/page.tsx` and create `src/app/(site)/page.tsx` temporarily:

```tsx
export default function Home() {
  return <main className="p-10 font-display text-7xl">ELANG</main>;
}
```

- [ ] **Step 6: `next.config.ts`**

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async redirects() {
    return [{ source: "/ctf", destination: "/writeups", permanent: true }];
  },
};

export default nextConfig;
```

- [ ] **Step 7: Vitest config + scripts**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { include: ["tests/unit/**/*.test.ts"], environment: "node" },
});
```

```bash
pnpm pkg set scripts.dev="next dev -p 3000" scripts.test="vitest run" scripts.typecheck="tsc --noEmit" scripts.e2e="playwright test" scripts.check="pnpm lint && pnpm typecheck && pnpm test && pnpm build"
```

- [ ] **Step 8: Write the smoke test**

`tests/unit/smoke.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes, last wins", () => {
    expect(cn("px-2 text-sm", "px-4")).toBe("text-sm px-4");
  });
});
```

Run: `pnpm test`. Expected: 1 passed.

- [ ] **Step 9: Env files**

`.env.example`:
```env
DATABASE_URL="postgresql://portfolio:portfolio@127.0.0.1:5436/portfolio"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="replace-with-a-strong-password"
# openssl rand -base64 48
ADMIN_SESSION_SECRET="use-a-random-string-with-at-least-32-characters"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```
Copy it to `.env.local`, setting `ADMIN_PASSWORD=dev-password` and a 48-char random `ADMIN_SESSION_SECRET` (`openssl rand -base64 48`).

- [ ] **Step 10: Extract uploads, verify build, commit**

```bash
mkdir -p public && tar xzf uploads-2026-10-06.tar.gz -C public && ls public/uploads | wc -l   # expect 194
cp .legacy/public/profile.jpg .legacy/public/favicon.ico .legacy/public/favicon.png public/
pnpm typecheck && pnpm lint && pnpm build
git add -A && git commit -m "chore: scaffold Next 16 + Tailwind v4 + shadcn with design tokens

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
Expected: build succeeds, `public/uploads` is not committed (gitignored).

---

### Task 2: Prisma schema, legacy-compatible migrations, JSON helpers

**Files:**
- Create: `prisma.config.ts`, `prisma/schema.prisma`, `prisma/migrations/20260725150000_init_postgres/migration.sql` (copied), `prisma/migrations/20260825083000_add_achievement_proof_score/migration.sql` (copied), `prisma/migrations/20261006000000_writeups_slug_partial_unique/migration.sql`, `prisma/migrations/migration_lock.toml`, `src/lib/db.ts`, `src/lib/json.ts`
- Test: `tests/unit/json.test.ts`

**Interfaces:**
- Produces:
  - `prisma` (PrismaClient) from `@/lib/db`. The generated client lives at `src/generated/prisma` (gitignored, generated on `postinstall`), with model accessors `prisma.writeup`, `prisma.project`, `prisma.achievement`, `prisma.secureMessage`, `prisma.accessLog`, `prisma.profileSettings`.
  - From `@/lib/json`: `parseStringArray(v: unknown): string[]`, `parseObjectArray<T>(v: unknown, guard: (x: Record<string, unknown>) => T | null): T[]`, `parseRecord(v: unknown): Record<string, unknown>`.

- [ ] **Step 1: Write the failing JSON helper tests** (`tests/unit/json.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { parseObjectArray, parseRecord, parseStringArray } from "@/lib/json";

describe("parseStringArray", () => {
  it("keeps trimmed non-empty strings", () => {
    expect(parseStringArray(["PWN", " heap ", "", 3, null])).toEqual(["PWN", "heap"]);
  });
  it("accepts a JSON string", () => {
    expect(parseStringArray('["a","b"]')).toEqual(["a", "b"]);
  });
  it("returns [] for objects, garbage strings, null", () => {
    expect(parseStringArray({})).toEqual([]);
    expect(parseStringArray("not json")).toEqual([]);
    expect(parseStringArray(null)).toEqual([]);
  });
});

describe("parseObjectArray", () => {
  const guard = (x: Record<string, unknown>) =>
    typeof x.name === "string" ? { name: x.name, level: typeof x.level === "number" ? x.level : 0 } : null;
  it("maps valid entries and drops invalid ones", () => {
    expect(parseObjectArray([{ name: "Pwn", level: 70 }, { level: 3 }, "x", { name: "Rev" }], guard)).toEqual([
      { name: "Pwn", level: 70 },
      { name: "Rev", level: 0 },
    ]);
  });
  it("returns [] for non-arrays", () => {
    expect(parseObjectArray({ name: "x" }, guard)).toEqual([]);
  });
});

describe("parseRecord", () => {
  it("returns objects, rejects arrays and primitives", () => {
    expect(parseRecord({ a: 1 })).toEqual({ a: 1 });
    expect(parseRecord([1])).toEqual({});
    expect(parseRecord("x")).toEqual({});
  });
});
```

Run: `pnpm test tests/unit/json.test.ts`. Expected: FAIL, cannot resolve `@/lib/json`.

- [ ] **Step 2: Implement `src/lib/json.ts`**

```ts
function coerce(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function parseStringArray(value: unknown): string[] {
  const v = coerce(value);
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string").map((x) => x.trim()).filter(Boolean);
}

export function parseObjectArray<T>(value: unknown, guard: (x: Record<string, unknown>) => T | null): T[] {
  const v = coerce(value);
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const mapped = guard(item as Record<string, unknown>);
      if (mapped !== null) out.push(mapped);
    }
  }
  return out;
}

export function parseRecord(value: unknown): Record<string, unknown> {
  const v = coerce(value);
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}
```

Run: `pnpm test tests/unit/json.test.ts`. Expected: PASS.

- [ ] **Step 3: `prisma.config.ts`**

```ts
import "dotenv/config";
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
```

- [ ] **Step 4: `prisma/schema.prisma`** (camelCase fields mapped to the legacy columns)

```prisma
generator client {
  provider        = "prisma-client"
  output          = "../src/generated/prisma"
  previewFeatures = ["partialIndexes"]
}

datasource db {
  provider = "postgresql"
}

model Writeup {
  id              String    @id @default(uuid())
  slug            String?   @unique(map: "idx_writeups_slug", where: raw("(slug IS NOT NULL)"))
  title           String?
  competition     String?
  category        String?
  difficulty      String?
  date            DateTime? @db.Timestamptz(3)
  summary         String?
  content         String?
  flag            String?
  tagsJson        Json      @default("[]") @map("tags_json")
  attachmentsJson Json      @default("[]") @map("attachments_json")
  createdAt       DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt       DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@index([createdAt(sort: Desc)])
  @@map("writeups")
}

model Project {
  id          String   @id @default(uuid())
  title       String?
  description String?
  imageUrl    String?  @map("image_url")
  projectUrl  String?  @map("project_url")
  category    String?
  tagsJson    Json     @default("[]") @map("tags_json")
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@index([createdAt(sort: Desc)])
  @@map("projects")
}

model Achievement {
  id          String    @id @default(uuid())
  title       String?
  issuer      String?
  platform    String?
  description String?
  imageUrl    String?   @map("image_url")
  date        DateTime? @db.Timestamptz(3)
  proofScore  Int?      @map("proof_score")
  createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@index([createdAt(sort: Desc)])
  @@map("achievements")
}

model SecureMessage {
  id        String   @id @default(uuid())
  title     String?
  content   String?
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)
  username  String?
  source    String?

  @@index([createdAt(sort: Desc)])
  @@map("secure_messages")
}

model AccessLog {
  id               String   @id @default(uuid())
  username         String?
  accessedAt       DateTime @map("accessed_at") @db.Timestamptz(3)
  accessSuccessful Boolean  @map("access_successful")
  ip               String?
  createdAt        DateTime @default(now()) @map("created_at") @db.Timestamptz(3)

  @@index([accessedAt(sort: Desc)])
  @@map("access_logs")
}

model ProfileSettings {
  id                      String   @id @default("main")
  displayName             String?  @map("display_name")
  alias                   String?
  navbarBrandMode         String   @default("default") @map("navbar_brand_mode")
  navbarBrandName         String?  @map("navbar_brand_name")
  email                   String?
  websiteUrl              String?  @map("website_url")
  githubUrl               String?  @map("github_url")
  instagramUrl            String?  @map("instagram_url")
  profileImageUrl         String?  @map("profile_image_url")
  aboutText               String?  @map("about_text")
  philosophyText          String?  @map("philosophy_text")
  technicalArsenalJson    Json     @default("[]") @map("technical_arsenal_json")
  professionalJourneyJson Json     @default("[]") @map("professional_journey_json")
  educationHistoryJson    Json     @default("[]") @map("education_history_json")
  seoSettingsJson         Json     @default("{}") @map("seo_settings_json")
  updatedAt               DateTime @updatedAt @map("updated_at") @db.Timestamptz(3)

  @@map("profile_settings")
}
```

- [ ] **Step 5: Copy legacy migrations byte-for-byte and add the partial index migration**

```bash
mkdir -p prisma/migrations
cp -r .legacy/prisma/migrations/20260725150000_init_postgres .legacy/prisma/migrations/20260825083000_add_achievement_proof_score prisma/migrations/
printf 'provider = "postgresql"\n' > prisma/migrations/migration_lock.toml
mkdir -p prisma/migrations/20261006000000_writeups_slug_partial_unique
cat > prisma/migrations/20261006000000_writeups_slug_partial_unique/migration.sql <<'SQL'
-- Present in production (created outside migrations); create on fresh databases.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_writeups_slug" ON "writeups"("slug") WHERE "slug" IS NOT NULL;
SQL
cmp .legacy/prisma/migrations/20260725150000_init_postgres/migration.sql prisma/migrations/20260725150000_init_postgres/migration.sql && echo identical
```

- [ ] **Step 6: Generate client, wire postinstall, ignore generated output**

```bash
pnpm pkg set scripts.postinstall="prisma generate" scripts.db:migrate="prisma migrate deploy"
echo 'src/generated/' >> .gitignore
pnpm prisma generate
```

- [ ] **Step 7: `src/lib/db.ts`**

```ts
import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

Run `pnpm add server-only`. For Vitest, add `test.alias: { "server-only": new URL("./tests/unit/stubs/empty.ts", import.meta.url).pathname }` to `vitest.config.ts` and create `tests/unit/stubs/empty.ts` containing `export {};`.

- [ ] **Step 8: Verify schema ⇔ restored DB parity (sandbox disabled, hits local DB)**

```bash
pnpm prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
```
Expected: `-- This is an empty migration.` (or no statements). If it prints statements, the schema is wrong. Fix the schema, not the DB.

```bash
pnpm prisma migrate deploy
```
Expected: applies only `20261006000000_writeups_slug_partial_unique` (the index already exists, so `IF NOT EXISTS` makes it a no-op), and reports the 2 legacy migrations as already applied.

- [ ] **Step 9: Commit**

```bash
pnpm test && pnpm typecheck
git add -A && git commit -m "feat(db): legacy-compatible Prisma 7 schema, migrations and JSON parsers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Domain types and data access layer

**Files:**
- Create: `src/lib/types.ts`, `src/lib/data/mappers.ts`, `src/lib/data/profile.ts`, `src/lib/data/writeups.ts`, `src/lib/data/projects.ts`, `src/lib/data/achievements.ts`
- Test: `tests/unit/mappers.test.ts`

**Interfaces:**
- Consumes: `prisma` (`@/lib/db`), `parseStringArray/parseObjectArray/parseRecord` (`@/lib/json`), Prisma model types from `@/generated/prisma/client`.
- Produces (`@/lib/types`):
```ts
export type Attachment = { url: string; name: string; contentType: string };
export type WriteupSummary = { id: string; href: string; slug: string | null; title: string; competition: string; category: string; difficulty: string | null; date: string | null; summary: string; tags: string[]; cover: string | null };
export type WriteupDetail = WriteupSummary & { content: string; flag: string | null; attachments: Attachment[] };
export type ProjectItem = { id: string; title: string; description: string; imageUrl: string | null; projectUrl: string | null; category: string; tags: string[] };
export type AchievementItem = { id: string; title: string; issuer: string | null; platform: string | null; description: string; imageUrl: string | null; date: string | null; year: number | null; proofScore: number };
export type Skill = { name: string; level: number };
export type JourneyItem = { role: string; company: string; period: string; desc: string };
export type EducationItem = { level: string; school: string; period: string };
export type SeoSettings = { jobTitle?: string; keywords: string[]; sameAs: string[]; locale?: string; description?: string };
export type Profile = { displayName: string; alias: string; brand: string; email: string | null; websiteUrl: string | null; githubUrl: string | null; instagramUrl: string | null; profileImageUrl: string; aboutText: string; philosophyText: string; skills: Skill[]; journey: JourneyItem[]; education: EducationItem[]; seo: SeoSettings };
```
- Produces (`@/lib/data/mappers`): `toWriteupSummary(row)`, `toWriteupDetail(row)`, `toProject(row)`, `toAchievement(row)`, `toProfile(row | null)`, `firstImageSrc(html: string): string | null`, `sortSkillsPwnFirst(skills: Skill[]): Skill[]`, `normalizeCategory(c: string | null): string`.
- Produces (data functions, all `React.cache`-wrapped, server-only):
  - `getProfile(): Promise<Profile>`
  - `listWriteups(): Promise<WriteupSummary[]>` (date desc, then createdAt desc)
  - `getWriteup(slugOrId: string): Promise<WriteupDetail | null>`
  - `getAdjacentWriteups(w: WriteupSummary): Promise<{ prev: WriteupSummary | null; next: WriteupSummary | null }>` (same category, date order)
  - `getCategoryStats(): Promise<{ category: string; count: number }[]>` (Pwn first, then count desc)
  - `getCompetitions(): Promise<string[]>` (distinct non-empty, by frequency)
  - `listProjects(): Promise<ProjectItem[]>`
  - `listAchievements(): Promise<AchievementItem[]>` (date desc)

- [ ] **Step 1: Write failing mapper tests** (`tests/unit/mappers.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { firstImageSrc, normalizeCategory, sortSkillsPwnFirst, toAchievement, toProfile, toWriteupDetail, toWriteupSummary } from "@/lib/data/mappers";

const baseWriteup = {
  id: "076c1db0-0000-4000-8000-000000000001",
  slug: "pwn-truman",
  title: "Truman",
  competition: "SCTF 2026",
  category: "Pwn",
  difficulty: "Medium",
  date: new Date("2026-08-22T00:00:00Z"),
  summary: "UAF to ret2libc",
  content: '<p><img src="/api/public/uploads/a.png"></p><h2>Recon</h2>',
  flag: "SCTF{x}",
  tagsJson: ["PWN", "heap"],
  attachmentsJson: [{ url: "/api/public/uploads/x", name: "x", contentType: "application/octet-stream" }, { nope: 1 }],
  createdAt: new Date("2026-08-22T00:00:00Z"),
  updatedAt: new Date("2026-08-22T00:00:00Z"),
};

describe("writeup mappers", () => {
  it("maps a full row", () => {
    const s = toWriteupSummary(baseWriteup);
    expect(s).toMatchObject({ href: "/writeups/pwn-truman", title: "Truman", category: "Pwn", date: "2026-08-22T00:00:00.000Z", tags: ["PWN", "heap"], cover: "/api/public/uploads/a.png" });
  });
  it("falls back for sparse legacy rows", () => {
    const s = toWriteupSummary({ ...baseWriteup, slug: null, title: null, category: null, competition: null, date: null, summary: null, content: null, tagsJson: {} });
    expect(s).toMatchObject({ href: `/writeups/${baseWriteup.id}`, title: "Untitled", category: "Misc", competition: "", date: null, summary: "", tags: [], cover: null });
  });
  it("keeps only valid attachments", () => {
    expect(toWriteupDetail(baseWriteup).attachments).toHaveLength(1);
  });
});

describe("helpers", () => {
  it("firstImageSrc finds the first img src", () => {
    expect(firstImageSrc('<p>x</p><img alt="a" src="/u/1.png"><img src="/u/2.png">')).toBe("/u/1.png");
    expect(firstImageSrc("<p>none</p>")).toBeNull();
  });
  it("normalizeCategory title-cases known categories", () => {
    expect(normalizeCategory("pwn")).toBe("Pwn");
    expect(normalizeCategory("  reverse ")).toBe("Reverse");
    expect(normalizeCategory("")).toBe("Misc");
  });
  it("sortSkillsPwnFirst pins binary exploitation then sorts by level", () => {
    const out = sortSkillsPwnFirst([
      { name: "Digital Forensic", level: 80 },
      { name: "Binary Exploitation", level: 70 },
      { name: "Programming", level: 67 },
    ]);
    expect(out.map((s) => s.name)).toEqual(["Binary Exploitation", "Digital Forensic", "Programming"]);
  });
});

describe("achievement + profile", () => {
  it("computes year and proof score fallback", () => {
    const a = toAchievement({ id: "a", title: "Top 20", issuer: "DCSC", platform: null, description: null, imageUrl: "/x.png", date: new Date("2026-05-01"), proofScore: null, createdAt: new Date(), updatedAt: new Date() });
    expect(a.year).toBe(2026);
    expect(a.proofScore).toBeGreaterThan(0);
  });
  it("returns defaults when the profile row is missing", () => {
    const p = toProfile(null);
    expect(p.displayName).toBe("Elang Dimas Syadewa");
    expect(p.alias).toBe("Claritys");
    expect(p.skills[0].name).toMatch(/pwn|binary/i);
  });
});
```

Run: `pnpm test tests/unit/mappers.test.ts`. Expected: FAIL (module missing).

- [ ] **Step 2: Create `src/lib/types.ts`** with exactly the type block listed in **Interfaces** above.

- [ ] **Step 3: Implement `src/lib/data/mappers.ts`**

```ts
import type { Achievement, ProfileSettings, Project, Writeup } from "@/generated/prisma/client";
import { parseObjectArray, parseRecord, parseStringArray } from "@/lib/json";
import type { AchievementItem, Attachment, EducationItem, JourneyItem, Profile, ProjectItem, Skill, WriteupDetail, WriteupSummary } from "@/lib/types";

const KNOWN_CATEGORIES = ["Pwn", "Reverse", "Forensics", "Crypto", "Web", "Misc", "OSINT"];

export function normalizeCategory(c: string | null): string {
  const v = (c ?? "").trim();
  if (!v) return "Misc";
  const hit = KNOWN_CATEGORIES.find((k) => k.toLowerCase() === v.toLowerCase());
  return hit ?? v;
}

export function firstImageSrc(html: string): string | null {
  const m = /<img\b[^>]*?\bsrc\s*=\s*["']([^"']+)["']/i.exec(html);
  return m ? m[1] : null;
}

const iso = (d: Date | null) => (d ? d.toISOString() : null);

export function toWriteupSummary(row: Writeup): WriteupSummary {
  const content = row.content ?? "";
  return {
    id: row.id,
    slug: row.slug,
    href: `/writeups/${encodeURIComponent(row.slug || row.id)}`,
    title: row.title?.trim() || "Untitled",
    competition: row.competition?.trim() ?? "",
    category: normalizeCategory(row.category),
    difficulty: row.difficulty?.trim() || null,
    date: iso(row.date),
    summary: row.summary?.trim() ?? "",
    tags: parseStringArray(row.tagsJson),
    cover: firstImageSrc(content),
  };
}

export function toWriteupDetail(row: Writeup): WriteupDetail {
  const attachments = parseObjectArray<Attachment>(row.attachmentsJson, (x) =>
    typeof x.url === "string"
      ? { url: x.url, name: typeof x.name === "string" ? x.name : x.url.split("/").pop() ?? "file", contentType: typeof x.contentType === "string" ? x.contentType : "application/octet-stream" }
      : null,
  );
  return { ...toWriteupSummary(row), content: row.content ?? "", flag: row.flag?.trim() || null, attachments };
}

export function toProject(row: Project): ProjectItem {
  return {
    id: row.id,
    title: row.title?.trim() || "Untitled project",
    description: row.description?.trim() ?? "",
    imageUrl: row.imageUrl?.trim() || null,
    projectUrl: row.projectUrl?.trim() || null,
    category: row.category?.trim() || "Project",
    tags: parseStringArray(row.tagsJson),
  };
}

// Ported from .legacy/src/lib/achievement-utils.ts getAchievementProofScore
function fallbackProofScore(row: Achievement): number {
  const signal = [row.title, row.issuer, row.platform, row.description].filter(Boolean).join(" ").toLowerCase();
  const category = row.imageUrl && row.issuer ? "certification" : row.platform || /\b(ctf|competition|rank|place|winner|final|qual|tournament)\b/.test(signal) ? "competition" : "milestone";
  const base = category === "certification" ? 40 : category === "competition" ? 34 : 24;
  return base + (row.imageUrl ? 24 : 0) + (row.issuer ? 10 : 0) + (row.platform ? 8 : 0) + (row.description ? 4 : 0);
}

export function toAchievement(row: Achievement): AchievementItem {
  return {
    id: row.id,
    title: row.title?.trim() || "Untitled",
    issuer: row.issuer?.trim() || null,
    platform: row.platform?.trim() || null,
    description: row.description?.trim() ?? "",
    imageUrl: row.imageUrl?.trim() || null,
    date: iso(row.date),
    year: row.date ? row.date.getUTCFullYear() : null,
    proofScore: typeof row.proofScore === "number" ? row.proofScore : fallbackProofScore(row),
  };
}

const PWN = /pwn|binary exploitation/i;

export function sortSkillsPwnFirst(skills: Skill[]): Skill[] {
  return [...skills].sort((a, b) => Number(PWN.test(b.name)) - Number(PWN.test(a.name)) || b.level - a.level);
}

const DEFAULT_PROFILE: Profile = {
  displayName: "Elang Dimas Syadewa",
  alias: "Claritys",
  brand: "Claritys",
  email: null,
  websiteUrl: "https://claritys.web.id",
  githubUrl: "https://github.com/Claritys11",
  instagramUrl: null,
  profileImageUrl: "/profile.jpg",
  aboutText: "",
  philosophyText: "",
  skills: [{ name: "Binary Exploitation", level: 70 }],
  journey: [],
  education: [],
  seo: { keywords: [], sameAs: [] },
};

export function toProfile(row: ProfileSettings | null): Profile {
  if (!row) return DEFAULT_PROFILE;
  const seo = parseRecord(row.seoSettingsJson);
  const alias = row.alias?.trim() || DEFAULT_PROFILE.alias;
  return {
    displayName: row.displayName?.trim() || DEFAULT_PROFILE.displayName,
    alias,
    brand: row.navbarBrandMode === "custom" && row.navbarBrandName?.trim() ? row.navbarBrandName.trim() : alias,
    email: row.email?.trim() || null,
    websiteUrl: row.websiteUrl?.trim() || null,
    githubUrl: row.githubUrl?.trim() || null,
    instagramUrl: row.instagramUrl?.trim() || null,
    profileImageUrl: row.profileImageUrl?.trim() || DEFAULT_PROFILE.profileImageUrl,
    aboutText: row.aboutText?.trim() ?? "",
    philosophyText: row.philosophyText?.trim() ?? "",
    skills: sortSkillsPwnFirst(
      parseObjectArray<Skill>(row.technicalArsenalJson, (x) =>
        typeof x.name === "string" ? { name: x.name, level: typeof x.level === "number" ? Math.max(0, Math.min(100, x.level)) : 0 } : null,
      ),
    ),
    journey: parseObjectArray<JourneyItem>(row.professionalJourneyJson, (x) =>
      typeof x.role === "string" ? { role: x.role, company: String(x.company ?? ""), period: String(x.period ?? ""), desc: String(x.desc ?? "") } : null,
    ),
    education: parseObjectArray<EducationItem>(row.educationHistoryJson, (x) =>
      typeof x.school === "string" ? { school: x.school, level: String(x.level ?? ""), period: String(x.period ?? "") } : null,
    ),
    seo: {
      jobTitle: typeof seo.jobTitle === "string" ? seo.jobTitle : undefined,
      locale: typeof seo.locale === "string" ? seo.locale : undefined,
      description: typeof seo.description === "string" ? seo.description : undefined,
      keywords: parseStringArray(seo.keywords),
      sameAs: parseStringArray(seo.sameAs),
    },
  };
}
```

Run: `pnpm test tests/unit/mappers.test.ts`. Expected: PASS.

- [ ] **Step 4: Data functions.** `src/lib/data/profile.ts`:

```ts
import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { toProfile } from "./mappers";

export const getProfile = cache(async () => toProfile(await prisma.profileSettings.findUnique({ where: { id: "main" } })));
```

`src/lib/data/writeups.ts`:
```ts
import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { WriteupSummary } from "@/lib/types";
import { toWriteupDetail, toWriteupSummary } from "./mappers";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const listWriteups = cache(async () => {
  const rows = await prisma.writeup.findMany({ orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] });
  return rows.map(toWriteupSummary);
});

export const getWriteup = cache(async (slugOrId: string) => {
  const key = decodeURIComponent(slugOrId);
  const row =
    (await prisma.writeup.findFirst({ where: { slug: key } })) ??
    (UUID.test(key) ? await prisma.writeup.findUnique({ where: { id: key } }) : null);
  return row ? toWriteupDetail(row) : null;
});

export async function getAdjacentWriteups(w: WriteupSummary) {
  const same = (await listWriteups()).filter((x) => x.category === w.category);
  const i = same.findIndex((x) => x.id === w.id);
  return { prev: i > 0 ? same[i - 1] : null, next: i >= 0 && i < same.length - 1 ? same[i + 1] : null };
}

export const getCategoryStats = cache(async () => {
  const counts = new Map<string, number>();
  for (const w of await listWriteups()) counts.set(w.category, (counts.get(w.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => Number(b.category === "Pwn") - Number(a.category === "Pwn") || b.count - a.count);
});

export const getCompetitions = cache(async () => {
  const counts = new Map<string, number>();
  for (const w of await listWriteups()) if (w.competition) counts.set(w.competition, (counts.get(w.competition) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
});
```

`src/lib/data/projects.ts`:
```ts
import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { toProject } from "./mappers";

export const listProjects = cache(async () => (await prisma.project.findMany({ orderBy: { createdAt: "desc" } })).map(toProject));
```

`src/lib/data/achievements.ts`:
```ts
import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { toAchievement } from "./mappers";

export const listAchievements = cache(async () =>
  (await prisma.achievement.findMany({ orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] })).map(toAchievement),
);
```

- [ ] **Step 5: Live check against the restored DB (sandbox disabled)**

```bash
cat > /tmp/claude-1000/check-data.ts <<'TS'
import { listWriteups, getCategoryStats, getWriteup } from "@/lib/data/writeups";
import { getProfile } from "@/lib/data/profile";
(async () => {
  console.log((await listWriteups()).length, await getCategoryStats());
  console.log((await getWriteup("pwn-truman"))?.title, (await getProfile()).skills[0]);
  process.exit(0);
})();
TS
NODE_OPTIONS=--conditions=react-server pnpm tsx -r dotenv/config /tmp/claude-1000/check-data.ts dotenv_config_path=.env.local
```
Expected: `39 [ { category: 'Pwn', count: 23 }, { category: 'Forensics', count: 11 }, ... ]`, then `Truman { name: 'Binary Exploitation', level: 70 }`. (The `react-server` condition makes `server-only` resolve to its no-op export outside Next.)

- [ ] **Step 6: Commit**

```bash
pnpm test && pnpm typecheck
git add -A && git commit -m "feat(data): domain mappers and cached data access

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Upload storage and the public uploads route

**Files:**
- Create: `src/lib/uploads.ts`, `src/app/api/public/uploads/[name]/route.ts`
- Test: `tests/unit/uploads.test.ts`

**Interfaces:**
- Produces (`@/lib/uploads`):
  - `UPLOADS_DIR: string` (absolute `public/uploads`, overridable via `UPLOADS_DIR` env for tests)
  - `isValidAssetName(name: string): boolean`
  - `mimeFor(name: string): string`
  - `toStoredName(original: string): string` → `<uuid>-<sanitized>` (sanitized: `[^a-zA-Z0-9._-]` → `-`, collapsed, max 120 chars, keeps extension)
  - `publicUploadUrl(name: string): string` → `/api/public/uploads/<encoded>`
  - `readUpload(name): Promise<{ stream: ReadableStream; size: number; contentType: string } | { error: 400 | 404 }>`
  - `writeUpload(file: File): Promise<{ name: string; url: string; contentType: string }>` (throws `UploadError` with `.status` 413/415)
  - `deleteUpload(name): Promise<200 | 400 | 404>`
  - `listUploads(): Promise<{ name: string; size: number; modified: string; url: string }[]>`
  - `MAX_UPLOAD_BYTES = 30 * 1024 * 1024`

- [ ] **Step 1: Failing tests** (`tests/unit/uploads.test.ts`)

```ts
import { mkdtemp, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

let mod: typeof import("@/lib/uploads");
let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "uploads-"));
  process.env.UPLOADS_DIR = dir;
  await writeFile(path.join(dir, "abc-shot.png"), Buffer.from([1, 2, 3]));
  mod = await import("@/lib/uploads");
});

describe("isValidAssetName", () => {
  it.each(["../etc/passwd", "a/b", "a\\b", "", "x\u0000y", ".", "..", "a".repeat(256)])("rejects %j", (n) => {
    expect(mod.isValidAssetName(n)).toBe(false);
  });
  it("accepts legacy names", () => {
    expect(mod.isValidAssetName("0e44ad9a-7c85-4961-92d9-92611c0cf7ba-cmsms.pcapng")).toBe(true);
    expect(mod.isValidAssetName("6e464511-a13e-42da-bdc6-e683285a461d-koperasi")).toBe(true);
  });
});

describe("toStoredName / mimeFor", () => {
  it("prefixes uuid and sanitizes", () => {
    expect(mod.toStoredName("My Shot (1).PNG")).toMatch(/^[0-9a-f-]{36}-My-Shot-1-\.PNG$/);
  });
  it("maps extensions case-insensitively, defaults to octet-stream", () => {
    expect(mod.mimeFor("a.PNG")).toBe("image/png");
    expect(mod.mimeFor("a.pcapng")).toBe("application/octet-stream");
  });
});

describe("read / delete", () => {
  it("reads an existing file", async () => {
    const r = await mod.readUpload("abc-shot.png");
    expect("stream" in r && r.size).toBe(3);
  });
  it("400 on traversal, 404 when missing", async () => {
    expect(await mod.readUpload("../secret")).toEqual({ error: 400 });
    expect(await mod.readUpload("missing.png")).toEqual({ error: 404 });
  });
  it("writes then deletes", async () => {
    const saved = await mod.writeUpload(new File([new Uint8Array([9])], "note.txt", { type: "text/plain" }));
    expect(saved.url).toBe(`/api/public/uploads/${encodeURIComponent(saved.name)}`);
    expect(await readdir(dir)).toContain(saved.name);
    expect(await mod.deleteUpload(saved.name)).toBe(200);
    expect(await mod.deleteUpload(saved.name)).toBe(404);
  });
});
```

Run: `pnpm test tests/unit/uploads.test.ts`. Expected: FAIL.

- [ ] **Step 2: Implement `src/lib/uploads.ts`**

```ts
import { createReadStream } from "node:fs";
import { mkdir, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

export const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public", "uploads"));
export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;

export class UploadError extends Error {
  constructor(message: string, public status: 413 | 415) {
    super(message);
  }
}

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".avif": "image/avif", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8", ".json": "application/json",
};

export function mimeFor(name: string): string {
  return MIME[path.extname(name).toLowerCase()] ?? "application/octet-stream";
}

export function isValidAssetName(name: string): boolean {
  if (typeof name !== "string" || name.length === 0 || name.length > 255) return false;
  if (name === "." || name === "..") return false;
  if (/[/\\]/.test(name) || /[\u0000-\u001f\u007f]/.test(name)) return false;
  return path.dirname(path.join(UPLOADS_DIR, name)) === UPLOADS_DIR;
}

export function toStoredName(original: string): string {
  const base = path.basename(original).replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-{2,}/g, "-").slice(-120) || "file.bin";
  return `${randomUUID()}-${base}`;
}

export const publicUploadUrl = (name: string) => `/api/public/uploads/${encodeURIComponent(name)}`;

export async function readUpload(name: string) {
  if (!isValidAssetName(name)) return { error: 400 as const };
  const file = path.join(UPLOADS_DIR, name);
  try {
    const s = await stat(file);
    if (!s.isFile()) return { error: 404 as const };
    const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;
    return { stream, size: s.size, contentType: mimeFor(name) };
  } catch {
    return { error: 404 as const };
  }
}

// SVG is excluded: an uploaded SVG served same-origin could carry script.
const ALLOWED = /^(image\/(png|jpe?g|gif|webp|avif)|application\/(pdf|zip|octet-stream|x-zip-compressed|vnd\.tcpdump\.pcap)|text\/plain|video\/mp4|audio\/mpeg)$/;

export async function writeUpload(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("File too large (max 30MB).", 413);
  const type = file.type || "application/octet-stream";
  if (!ALLOWED.test(type)) throw new UploadError(`Type ${type} not allowed.`, 415);
  const name = toStoredName(file.name);
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { name, url: publicUploadUrl(name), contentType: type };
}

export async function deleteUpload(name: string): Promise<200 | 400 | 404> {
  if (!isValidAssetName(name)) return 400;
  try {
    await unlink(path.join(UPLOADS_DIR, name));
    return 200;
  } catch {
    return 404;
  }
}

export async function listUploads() {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const names = await readdir(UPLOADS_DIR);
  const items = await Promise.all(
    names.filter(isValidAssetName).map(async (name) => {
      const s = await stat(path.join(UPLOADS_DIR, name));
      return { name, size: s.size, modified: s.mtime.toISOString(), url: publicUploadUrl(name) };
    }),
  );
  return items.sort((a, b) => b.modified.localeCompare(a.modified));
}
```

Run: `pnpm test tests/unit/uploads.test.ts`. Expected: PASS.

- [ ] **Step 3: Route `src/app/api/public/uploads/[name]/route.ts`**

```ts
import { readUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const result = await readUpload(name.trim());
  if ("error" in result) {
    return Response.json({ error: result.error === 400 ? "Invalid asset name." : "File not found." }, { status: result.error });
  }
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "-") || "asset.bin";
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.size),
      "Content-Disposition": `inline; filename="${safe}"`,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
```

Note: Next decodes `params.name`, so `..%2Fsecret` arrives as `../secret` and is rejected by `isValidAssetName`.

- [ ] **Step 4: Manual check (sandbox disabled)**

```bash
pnpm dev & sleep 6
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" "http://localhost:3000/api/public/uploads/$(ls public/uploads | grep png | head -1)"   # 200 image/png
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/public/uploads/..%2F..%2Fpackage.json"                            # 400
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/public/uploads/nope.png"                                         # 404
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(uploads): storage helpers and legacy-compatible public uploads route

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Session, rate limiter, auth routes and proxy

**Files:**
- Create: `src/lib/session.ts`, `src/lib/rate-limit.ts`, `src/lib/request.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/proxy.ts`, `src/lib/admin/guard.ts`
- Test: `tests/unit/session.test.ts`, `tests/unit/rate-limit.test.ts`, `tests/unit/request.test.ts`

**Interfaces:**
- Produces:
  - `@/lib/session`: `COOKIE_NAME = "admin_session"`, `SESSION_TTL_MS = 8h`, `createSessionToken(username: string, now?: number): string`, `verifySessionToken(token: string | undefined, now?: number): { username: string; exp: number } | null`, `checkCredentials(u: string, p: string): boolean` (timing-safe), `getSession(): Promise<{username,exp} | null>` (reads `cookies()`).
  - `@/lib/rate-limit`: `createRateLimiter({ limit, windowMs, now? }) => { hit(key: string): { ok: boolean; retryAfter: number } }`.
  - `@/lib/request`: `clientIp(h: Headers): string` (first `x-forwarded-for` entry, else `x-real-ip`, else `"unknown"`).
  - `@/lib/admin/guard`: `requireAdmin(): Promise<{ username: string }>` (redirects to `/admin/login` when missing), used by every Server Action and admin page.
- Session tokens use the Web Crypto-free Node `crypto` HMAC. `proxy.ts` runs on the Node runtime in Next 16, so it can import `@/lib/session`.

- [ ] **Step 1: Failing tests**

`tests/unit/session.test.ts`:
```ts
import { beforeEach, describe, expect, it } from "vitest";
import { checkCredentials, createSessionToken, SESSION_TTL_MS, verifySessionToken } from "@/lib/session";

beforeEach(() => {
  process.env.ADMIN_SESSION_SECRET = "x".repeat(40);
  process.env.ADMIN_USERNAME = "admin";
  process.env.ADMIN_PASSWORD = "pw";
});

describe("session tokens", () => {
  it("round-trips", () => {
    const t = createSessionToken("admin", 1000);
    expect(verifySessionToken(t, 2000)).toEqual({ username: "admin", exp: 1000 + SESSION_TTL_MS });
  });
  it("rejects expired, tampered, foreign-user and empty tokens", () => {
    const t = createSessionToken("admin", 0);
    expect(verifySessionToken(t, SESSION_TTL_MS + 1)).toBeNull();
    expect(verifySessionToken(t.slice(0, -2) + "xx", 1)).toBeNull();
    expect(verifySessionToken(createSessionToken("mallory", 0), 1)).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("garbage")).toBeNull();
  });
  it("throws when the secret is too short", () => {
    process.env.ADMIN_SESSION_SECRET = "short";
    expect(() => createSessionToken("admin")).toThrow(/ADMIN_SESSION_SECRET/);
  });
});

describe("checkCredentials", () => {
  it("accepts exact match only", () => {
    expect(checkCredentials("admin", "pw")).toBe(true);
    expect(checkCredentials("admin", "pw ")).toBe(false);
    expect(checkCredentials("Admin", "pw")).toBe(false);
  });
});
```

`tests/unit/rate-limit.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows `limit` hits per window per key", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 3, windowMs: 1000, now: () => t });
    expect([rl.hit("a").ok, rl.hit("a").ok, rl.hit("a").ok, rl.hit("a").ok]).toEqual([true, true, true, false]);
    expect(rl.hit("b").ok).toBe(true);
    expect(rl.hit("a").retryAfter).toBe(1);
    t = 1001;
    expect(rl.hit("a").ok).toBe(true);
  });
});
```

`tests/unit/request.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/request";

describe("clientIp", () => {
  it("uses the first forwarded hop", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" }))).toBe("1.2.3.4");
    expect(clientIp(new Headers({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
```

Run: `pnpm test`. Expected: the 3 new files FAIL.

- [ ] **Step 2: Implement `src/lib/session.ts`** (ported from `.legacy/src/lib/session.ts`, plus an injectable clock and credential check)

```ts
import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "admin_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type Payload = { username: string; exp: number };

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set and at least 32 characters long.");
  return s;
}

const mac = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function createSessionToken(username: string, now = Date.now()): string {
  const encoded = Buffer.from(JSON.stringify({ username, exp: now + SESSION_TTL_MS } satisfies Payload)).toString("base64url");
  return `${encoded}.${mac(encoded)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): Payload | null {
  if (!token) return null;
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 1) return null;
    const encoded = token.slice(0, dot);
    if (!safeEqual(token.slice(dot + 1), mac(encoded))) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Payload;
    if (typeof payload.exp !== "number" || now > payload.exp) return null;
    if (!process.env.ADMIN_USERNAME || payload.username !== process.env.ADMIN_USERNAME) return null;
    return payload;
  } catch {
    return null;
  }
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  // Evaluate both comparisons so timing does not reveal which field failed.
  const okU = safeEqual(String(username), u);
  const okP = safeEqual(String(password), p);
  return okU && okP;
}

export async function getSession(): Promise<Payload | null> {
  const { cookies } = await import("next/headers");
  return verifySessionToken((await cookies()).get(COOKIE_NAME)?.value);
}
```

- [ ] **Step 3: Implement `src/lib/rate-limit.ts` and `src/lib/request.ts`**

```ts
// src/lib/rate-limit.ts
export function createRateLimiter({ limit, windowMs, now = Date.now }: { limit: number; windowMs: number; now?: () => number }) {
  const buckets = new Map<string, { start: number; count: number }>();
  return {
    hit(key: string) {
      const t = now();
      let b = buckets.get(key);
      if (!b || t - b.start > windowMs) {
        b = { start: t, count: 0 };
        buckets.set(key, b);
      }
      b.count += 1;
      if (buckets.size > 5000) for (const [k, v] of buckets) if (t - v.start > windowMs) buckets.delete(k);
      return { ok: b.count <= limit, retryAfter: Math.ceil((b.start + windowMs - t) / 1000) };
    },
  };
}
```

```ts
// src/lib/request.ts
export function clientIp(h: Headers): string {
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
}
```

Run: `pnpm test`. Expected: all PASS.

- [ ] **Step 4: Login/logout routes**

`src/app/api/auth/login/route.ts`:
```ts
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { checkCredentials, COOKIE_NAME, createSessionToken, SESSION_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
const Body = z.object({ username: z.string().max(200), password: z.string().max(500) });

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const gate = limiter.hit(ip);
  if (!gate.ok) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(gate.retryAfter) } });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request." }, { status: 400 });

  const { username, password } = parsed.data;
  const ok = checkCredentials(username, password);
  await prisma.accessLog
    .create({ data: { username: username || "(unknown)", accessedAt: new Date(), accessSuccessful: ok, ip } })
    .catch(() => undefined);

  if (!ok) return Response.json({ error: "Invalid credentials." }, { status: 401 });

  (await cookies()).set(COOKIE_NAME, createSessionToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return Response.json({ ok: true });
}
```

`src/app/api/auth/logout/route.ts`:
```ts
import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/session";

export async function POST() {
  (await cookies()).delete(COOKIE_NAME);
  return Response.json({ ok: true });
}
```

- [ ] **Step 5: `src/lib/admin/guard.ts`**

```ts
import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return { username: s.username };
}
```

- [ ] **Step 6: `src/proxy.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySessionToken } from "@/lib/session";

const PRIMARY_HOST = "claritys.web.id";
const LEGACY_HOSTS = new Set(["clarityz.my.id", "www.clarityz.my.id", "claritys.my.id", "www.claritys.my.id", "portf.claritys.my.id"]);

export function proxy(req: NextRequest) {
  const host = req.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (LEGACY_HOSTS.has(host)) {
    const url = req.nextUrl.clone();
    url.protocol = "https";
    url.host = PRIMARY_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = req.nextUrl;
  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminArea && pathname !== "/admin/login") {
    const session = verifySessionToken(req.cookies.get(COOKIE_NAME)?.value);
    if (!session) {
      if (pathname.startsWith("/api/")) return Response.json({ error: "Unauthorized" }, { status: 401 });
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  const res = NextResponse.next();
  if (isAdminArea || pathname.startsWith("/api/auth")) res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon.png|profile.jpg).*)"],
};
```

- [ ] **Step 7: Verify and commit**

```bash
pnpm test && pnpm typecheck && pnpm build
git add -A && git commit -m "feat(auth): HMAC cookie session, rate limiter, login/logout, proxy gate

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Writeup HTML pipeline (sanitize, heading ids, TOC, Shiki)

**Files:**
- Create: `src/lib/html.ts`
- Test: `tests/unit/html.test.ts`

**Interfaces:**
- Produces: `renderWriteupHtml(html: string): Promise<{ html: string; toc: { id: string; text: string; depth: 2 | 3 }[] }>`

- [ ] **Step 1: Failing test** (`tests/unit/html.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { renderWriteupHtml } from "@/lib/html";

describe("renderWriteupHtml", () => {
  it("strips scripts and event handlers, keeps uploads images and tables", async () => {
    const { html } = await renderWriteupHtml(
      '<p onclick="x()">hi<script>alert(1)</script></p><img src="/api/public/uploads/a.png" onerror="x()"><table><tbody><tr><td>1</td></tr></tbody></table><a href="javascript:alert(1)">x</a>',
    );
    expect(html).not.toMatch(/script|onclick|onerror|javascript:/);
    expect(html).toContain('src="/api/public/uploads/a.png"');
    expect(html).toContain("<td>1</td>");
  });
  it("adds heading ids and builds a toc", async () => {
    const { html, toc } = await renderWriteupHtml("<h2>Recon</h2><h3>Leak libc</h3><h2>Recon</h2>");
    expect(toc).toEqual([
      { id: "recon", text: "Recon", depth: 2 },
      { id: "leak-libc", text: "Leak libc", depth: 3 },
      { id: "recon-1", text: "Recon", depth: 2 },
    ]);
    expect(html).toContain('<h2 id="recon">');
  });
  it("highlights fenced code with a language class and leaves unknown ones readable", async () => {
    const { html } = await renderWriteupHtml('<pre><code class="language-python">print(1)</code></pre><pre><code>raw &lt;b&gt;</code></pre>');
    expect(html).toContain("shiki");
    expect(html).toContain("raw &#x3C;b>");
  });
  it("adds rel+target to external links only", async () => {
    const { html } = await renderWriteupHtml('<a href="https://x.dev">x</a><a href="/writeups">y</a>');
    expect(html).toContain('href="https://x.dev" rel="noopener noreferrer" target="_blank"');
    expect(html).toContain('<a href="/writeups">y</a>');
  });
});
```

Run: `pnpm test tests/unit/html.test.ts`. Expected: FAIL.

- [ ] **Step 2: Implement `src/lib/html.ts`**

```ts
import rehypeShiki from "@shikijs/rehype";
import type { Element, Root } from "hast";
import { toString } from "hast-util-to-string";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";

type TocItem = { id: string; text: string; depth: 2 | 3 };

const schema = {
  ...defaultSchema,
  clobberPrefix: "",
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-[\w+#-]+$/]],
    img: ["src", "alt", "title", "width", "height"],
    td: ["colSpan", "rowSpan"],
    th: ["colSpan", "rowSpan"],
  },
  protocols: { ...defaultSchema.protocols, src: ["http", "https"] },
};

function externalLinks() {
  return (tree: Root) =>
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "a") return;
      const href = String(node.properties?.href ?? "");
      if (/^https?:\/\//i.test(href)) {
        node.properties = { ...node.properties, rel: "noopener noreferrer", target: "_blank" };
      }
    });
}

function collectToc(toc: TocItem[]) {
  return () => (tree: Root) =>
    visit(tree, "element", (node: Element) => {
      if ((node.tagName === "h2" || node.tagName === "h3") && node.properties?.id) {
        toc.push({ id: String(node.properties.id), text: toString(node).trim(), depth: node.tagName === "h2" ? 2 : 3 });
      }
    });
}

function lazyImages() {
  return (tree: Root) =>
    visit(tree, "element", (node: Element) => {
      if (node.tagName === "img") node.properties = { ...node.properties, loading: "lazy", decoding: "async" };
    });
}

export async function renderWriteupHtml(input: string) {
  const toc: TocItem[] = [];
  const file = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, schema)
    .use(rehypeSlug)
    .use(collectToc(toc))
    .use(externalLinks)
    .use(lazyImages)
    .use(rehypeShiki, { themes: { light: "github-light", dark: "vesper" }, defaultColor: false, fallbackLanguage: "text", addLanguageClass: true })
    .use(rehypeStringify)
    .process(input);
  return { html: String(file), toc };
}
```

Note: `protocols.src` allows http/https, and relative paths such as `/api/public/uploads/...` are always allowed by hast-util-sanitize. If the test shows the uploads `src` stripped, remove the `protocols.src` override.

Add Shiki dual-theme CSS to `globals.css`:
```css
.shiki, .shiki span { color: var(--shiki-light); background-color: transparent; }
.dark .shiki, .dark .shiki span { color: var(--shiki-dark); }
```

Run: `pnpm test tests/unit/html.test.ts`. Expected: PASS. If the `raw &#x3C;b>` assertion fails only due to entity style, assert on the stringify output actually produced (escaped, not a live `<b>` element). The requirement is "no live tag", so `expect(html).not.toContain("<b>")` is the invariant.

- [ ] **Step 3: Run against all 39 real writeups (sandbox disabled)** to catch crashes on legacy HTML:

```bash
cat > /tmp/claude-1000/check-html.ts <<'TS'
import { prisma } from "@/lib/db";
import { renderWriteupHtml } from "@/lib/html";
(async () => {
  for (const w of await prisma.writeup.findMany()) {
    const r = await renderWriteupHtml(w.content ?? "");
    if (!r.html.length && (w.content ?? "").length) console.log("EMPTY", w.slug);
  }
  console.log("ok");
  process.exit(0);
})();
TS
NODE_OPTIONS=--conditions=react-server pnpm tsx -r dotenv/config /tmp/claude-1000/check-html.ts dotenv_config_path=.env.local
```
Expected: `ok` with no `EMPTY` lines.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(content): sanitized writeup HTML pipeline with TOC and Shiki

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 7: Motion foundation and the site shell (nav, smooth scroll, transitions)

**Files:**
- Create: `src/lib/motion.ts`, `src/components/motion/smooth-scroll.tsx`, `src/components/motion/reveal.tsx`, `src/components/motion/split-heading.tsx`, `src/components/motion/scramble-line.tsx`, `src/components/motion/scroll-counter.tsx`, `src/components/site/nav.tsx`, `src/components/site/theme-toggle.tsx`, `src/components/site/media.tsx`, `src/components/site/section-label.tsx`, `src/components/site/brand-icons.tsx`, `src/app/(site)/layout.tsx`, `src/app/(site)/template.tsx`, `src/app/(site)/error.tsx`
- Modify: `src/app/globals.css` (page-wipe keyframes)
- Test: `tests/unit/motion.test.ts`

**Interfaces:**
- Produces:
  - `@/lib/motion`: `gsap`, `ScrollTrigger`, `SplitText`, `ScrambleTextPlugin` (registered once, client-only), `NO_REDUCED = "(prefers-reduced-motion: no-preference)"`, `prefersReducedMotion(): boolean`, `toHexProgress(p: number): string` (`0x0000`..`0xFFFF`).
  - `@/components/motion/smooth-scroll`: `<SmoothScroll>{children}</SmoothScroll>`, `getLenis(): Lenis | null`, `scrollToTop(): void`.
  - `<Reveal as? y? stagger? className>`: children fade/rise on scroll. With `stagger`, direct children animate individually.
  - `<SplitHeading as="h1"|"h2" text className delay? onScroll?>`: chars rise from a mask.
  - `<ScrambleLine text className delay?>`: one-time decrypt.
  - `<ScrollCounter />`: hex progress.
  - `<Media src alt className label?>`: `<img>` for uploads, `/x.jpg` and `data:` URLs; a placeholder block when `src` is null.
  - `<SectionLabel index={1} name="writeups" />` renders `0x01 / writeups`.
  - `GithubIcon`, `InstagramIcon` (SVG components taking `className`).
  - Site layout renders: `Nav` → `<div id="content" class="relative z-10 bg-background">{page}{ContactSection}</div>` → `CinematicFooter`. ContactSection and Footer are wired in Tasks 8–9. Until then the layout renders a `{/* footer: Task 8 */}` slot.

- [ ] **Step 1: Failing test** (`tests/unit/motion.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { toHexProgress } from "@/lib/motion";

describe("toHexProgress", () => {
  it("maps 0..1 to 0x0000..0xFFFF and clamps", () => {
    expect(toHexProgress(0)).toBe("0x0000");
    expect(toHexProgress(1)).toBe("0xFFFF");
    expect(toHexProgress(0.5)).toBe("0x8000");
    expect(toHexProgress(-3)).toBe("0x0000");
    expect(toHexProgress(Number.NaN)).toBe("0x0000");
  });
});
```

Run: `pnpm test tests/unit/motion.test.ts`. Expected: FAIL.

- [ ] **Step 2: `src/lib/motion.ts`**

```ts
import { gsap } from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

export { gsap, ScrollTrigger, SplitText, ScrambleTextPlugin };

export const NO_REDUCED = "(prefers-reduced-motion: no-preference)";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function toHexProgress(p: number): string {
  const v = Number.isFinite(p) ? Math.min(1, Math.max(0, p)) : 0;
  return `0x${Math.round(v * 0xffff).toString(16).toUpperCase().padStart(4, "0")}`;
}
```

Run: `pnpm test tests/unit/motion.test.ts`. Expected: PASS.

- [ ] **Step 3: Smooth scroll** (`src/components/motion/smooth-scroll.tsx`)

```tsx
"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";

let lenis: Lenis | null = null;

export const getLenis = () => lenis;

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const instance = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis = instance;
    instance.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      lenis = null;
    };
  }, []);

  useEffect(() => {
    lenis?.scrollTo(0, { immediate: true });
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return <>{children}</>;
}
```

- [ ] **Step 4: Reveal primitives**

`src/components/motion/reveal.tsx`:
```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED } from "@/lib/motion";

type Props = { children: React.ReactNode; className?: string; y?: number; stagger?: boolean; as?: "div" | "section" | "ul" | "ol" };

export function Reveal({ children, className, y = 32, stagger = false, as: Tag = "div" }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const targets = stagger ? Array.from(ref.current!.children) : ref.current;
        gsap.from(targets, {
          y,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          stagger: stagger ? 0.08 : 0,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref as React.Ref<never>} className={className}>
      {children}
    </Tag>
  );
}
```

`src/components/motion/split-heading.tsx`:
```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

type Props = { text: string; as?: "h1" | "h2" | "p"; className?: string; delay?: number; onScroll?: boolean };

export function SplitHeading({ text, as: Tag = "h2", className, delay = 0, onScroll = false }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const split = SplitText.create(ref.current!, {
          type: "chars,words",
          mask: "chars",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 110,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.022,
              delay,
              scrollTrigger: onScroll ? { trigger: ref.current, start: "top 85%", once: true } : undefined,
            }),
        });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  );
}
```

`src/components/motion/scramble-line.tsx`:
```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED } from "@/lib/motion";

export function ScrambleLine({ text, className, delay = 0.6 }: { text: string; className?: string; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(NO_REDUCED, () => {
      gsap.to(ref.current, {
        delay,
        duration: 1.6,
        ease: "none",
        scrambleText: { text, chars: "0123456789abcdef", revealDelay: 0.4, speed: 0.5 },
      });
    });
    return () => mm.revert();
  });
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text}
    </span>
  );
}
```

`src/components/motion/scroll-counter.tsx`:
```tsx
"use client";

import { useEffect, useRef } from "react";
import { ScrollTrigger, toHexProgress } from "@/lib/motion";

export function ScrollCounter({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (ref.current) ref.current.textContent = toHexProgress(self.progress);
      },
    });
    return () => st.kill();
  }, []);
  return (
    <span ref={ref} className={className} aria-hidden>
      0x0000
    </span>
  );
}
```

- [ ] **Step 5: Small site components**

`src/components/site/section-label.tsx`:
```tsx
export function SectionLabel({ index, name, className = "" }: { index: number; name: string; className?: string }) {
  return (
    <p className={`meta ${className}`}>
      <span className="text-primary">0x{index.toString(16).padStart(2, "0").toUpperCase()}</span> / {name}
    </p>
  );
}
```

`src/components/site/media.tsx`:
```tsx
import { cn } from "@/lib/utils";

type Props = { src: string | null; alt: string; className?: string; label?: string; eager?: boolean };

export function Media({ src, alt, className, label, eager }: Props) {
  if (!src) {
    return (
      <div className={cn("grid place-items-center bg-muted", className)} role="img" aria-label={alt}>
        <span className="meta">{label ?? "no image"}</span>
      </div>
    );
  }
  // Plain <img>: sources include data: URLs and the uploads API route, which next/image can't optimise uniformly.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={cn("object-cover", className)} loading={eager ? "eager" : "lazy"} decoding="async" />;
}
```

`src/components/site/brand-icons.tsx`:
```tsx
type P = { className?: string };

export function GithubIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
    </svg>
  );
}

export function InstagramIcon({ className }: P) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
```

`src/components/site/theme-toggle.tsx`:
```tsx
"use client";

import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="meta hover:text-foreground"
      aria-label="Toggle colour theme"
    >
      <span className="dark:hidden">dark</span>
      <span className="hidden dark:inline">light</span>
    </button>
  );
}
```

`src/components/site/nav.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ScrollCounter } from "@/components/motion/scroll-counter";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/writeups", label: "Writeups" },
  { href: "/projects", label: "Projects" },
  { href: "/achievements", label: "Record" },
  { href: "/about", label: "About" },
];

export function Nav({ brand }: { brand: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50 mix-blend-difference text-white">
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 md:px-8">
        <Link href="/" className="font-display text-lg font-semibold tracking-tight" onClick={() => setOpen(false)}>
          {brand}
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn("text-sm transition-opacity hover:opacity-100", pathname.startsWith(l.href) ? "opacity-100" : "opacity-60")}
            >
              {l.label}
            </Link>
          ))}
          <ScrollCounter className="w-14 font-mono text-[11px] tabular-nums opacity-60" />
          <ThemeToggle />
        </div>
        <button type="button" className="meta text-white md:hidden" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((o) => !o)}>
          {open ? "close" : "menu"}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="flex flex-col gap-4 px-4 pb-8 md:hidden">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="font-display text-4xl" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <ThemeToggle />
        </div>
      )}
    </header>
  );
}
```

- [ ] **Step 6: Page wipe via CSS** (works without JS, disabled for reduced motion). Append to `globals.css`:

```css
@keyframes page-wipe { from { transform: scaleY(1); } to { transform: scaleY(0); } }
.page-wipe { position: fixed; inset: 0; z-index: 60; background: var(--foreground); transform-origin: top; pointer-events: none; animation: page-wipe 0.7s cubic-bezier(0.76, 0, 0.24, 1) 0.05s both; }
@media (prefers-reduced-motion: reduce) { .page-wipe { display: none; } }
```

`src/app/(site)/template.tsx`:
```tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="page-wipe" aria-hidden />
      {children}
    </>
  );
}
```

- [ ] **Step 7: Site layout + error boundary**

`src/app/(site)/layout.tsx`:
```tsx
import { SmoothScroll } from "@/components/motion/smooth-scroll";
import { Nav } from "@/components/site/nav";
import { getProfile } from "@/lib/data/profile";

export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  return (
    <SmoothScroll>
      <Nav brand={profile.brand} />
      <div id="content" className="relative z-10 bg-background">
        {children}
      </div>
      {/* footer: Task 8 */}
    </SmoothScroll>
  );
}
```

`src/app/(site)/error.tsx`:
```tsx
"use client";

export default function SiteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 px-4">
      <p className="meta">0xERR / content unavailable</p>
      <h1 className="font-display text-5xl font-bold tracking-tight md:text-7xl">Something didn&apos;t load.</h1>
      <button onClick={reset} className="meta w-fit border-b border-primary pb-1 text-foreground">
        try again
      </button>
    </main>
  );
}
```

Move the temporary `src/app/(site)/page.tsx` so it also exports `export const dynamic = "force-dynamic";`.

- [ ] **Step 8: Verify and commit**

```bash
pnpm test && pnpm typecheck && pnpm lint && pnpm build
git add -A && git commit -m "feat(motion): GSAP/Lenis foundation, nav, page wipe, site layout

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: CinematicFooter with the ELANG → CLARITYS glitch

**Files:**
- Create: `src/lib/glitch.ts`, `src/components/ui/motion-footer.tsx`
- Modify: `src/app/(site)/layout.tsx` (render footer)
- Test: `tests/unit/glitch.test.ts`

**Interfaces:**
- Consumes: `gsap`, `ScrollTrigger`, `NO_REDUCED`, `prefersReducedMotion` (`@/lib/motion`), `scrollToTop` (`@/components/motion/smooth-scroll`), `GithubIcon`, `InstagramIcon`, `cn`.
- Produces:
  - `@/lib/glitch`: `fitScaleX(primaryWidth: number, secretWidth: number): number` (≤1, 1 when either is 0), `nextGlitchDelay(min: number, max: number, rand?: () => number): number`, `sliceInset(rand?: () => number): string` (returns `inset(a% 0 b% 0)`, with the visible band at least 10%).
  - `@/components/ui/motion-footer`: `CinematicFooter(props: CinematicFooterProps)`, `MagneticButton`, `GlitchSwap`.
```ts
export type FooterLink = { label: string; href: string; icon?: "github" | "mail" | "instagram"; external?: boolean };
export type CinematicFooterProps = {
  giantText: string;          // "ELANG"
  secretText: string;         // "CLARITYS"
  marquee: string[];          // categories + competitions
  heading: string;            // "Got a binary for me?"
  primaryLinks: FooterLink[];
  secondaryLinks: FooterLink[];
  copyright: string;          // "© 2026 Elang Dimas Syadewa"
  creditName: string;         // "Claritys"
};
```

- [ ] **Step 1: Failing test** (`tests/unit/glitch.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { fitScaleX, nextGlitchDelay, sliceInset } from "@/lib/glitch";

describe("glitch helpers", () => {
  it("fitScaleX shrinks the wider secret to the primary width, never enlarges", () => {
    expect(fitScaleX(500, 800)).toBeCloseTo(0.625);
    expect(fitScaleX(800, 500)).toBe(1);
    expect(fitScaleX(0, 500)).toBe(1);
    expect(fitScaleX(500, 0)).toBe(1);
  });
  it("nextGlitchDelay stays within [min, max]", () => {
    expect(nextGlitchDelay(7000, 12000, () => 0)).toBe(7000);
    expect(nextGlitchDelay(7000, 12000, () => 0.999999)).toBeLessThanOrEqual(12000);
    expect(nextGlitchDelay(7000, 12000, () => 0.5)).toBe(9500);
  });
  it("sliceInset yields a visible band of at least 10%", () => {
    for (const r of [0, 0.3, 0.7, 0.99]) {
      const m = /^inset\((\d+)% 0 (\d+)% 0\)$/.exec(sliceInset(() => r))!;
      expect(100 - Number(m[1]) - Number(m[2])).toBeGreaterThanOrEqual(10);
    }
  });
});
```

Run: FAIL.

- [ ] **Step 2: `src/lib/glitch.ts`**

```ts
export function fitScaleX(primaryWidth: number, secretWidth: number): number {
  if (primaryWidth <= 0 || secretWidth <= 0) return 1;
  return Math.min(1, primaryWidth / secretWidth);
}

export function nextGlitchDelay(min: number, max: number, rand: () => number = Math.random): number {
  return Math.round(min + (max - min) * rand());
}

export function sliceInset(rand: () => number = Math.random): string {
  const top = Math.floor(rand() * 70);
  const band = 10 + Math.floor(rand() * 20);
  const bottom = Math.max(0, 100 - top - band);
  return `inset(${top}% 0 ${bottom}% 0)`;
}
```

Run: PASS.

- [ ] **Step 3: `src/components/ui/motion-footer.tsx`.** This is the user-provided component with these changes:
  - Content comes from props.
  - It uses `@/lib/motion` instead of registering plugins itself.
  - Fonts are inherited (no Plus Jakarta import).
  - Brand icons replace the App Store/Play icons.
  - `GlitchSwap` is added.
  - Back-to-top uses Lenis.
  - Mobile sizing is adjusted.
  - The curtain wrapper uses `min-h-svh`.

```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { Mail } from "lucide-react";
import * as React from "react";
import { useEffect, useRef } from "react";
import { scrollToTop } from "@/components/motion/smooth-scroll";
import { GithubIcon, InstagramIcon } from "@/components/site/brand-icons";
import { fitScaleX, nextGlitchDelay, sliceInset } from "@/lib/glitch";
import { gsap, NO_REDUCED, prefersReducedMotion, ScrollTrigger } from "@/lib/motion";
import { cn } from "@/lib/utils";

// 1. THEME-ADAPTIVE INLINE STYLES (from the provided component; font import removed, glitch layers added)
const STYLES = `
.cinematic-footer-wrapper {
  -webkit-font-smoothing: antialiased;
  --pill-bg-1: color-mix(in oklch, var(--foreground) 3%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--foreground) 1%, transparent);
  --pill-shadow: color-mix(in oklch, var(--background) 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--foreground) 10%, transparent);
  --pill-inset-shadow: color-mix(in oklch, var(--background) 80%, transparent);
  --pill-border: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-1-hover: color-mix(in oklch, var(--foreground) 8%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--foreground) 2%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
  --pill-shadow-hover: color-mix(in oklch, var(--background) 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--foreground) 20%, transparent);
}
@keyframes footer-breathe { 0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; } 100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; } }
@keyframes footer-scroll-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px color-mix(in oklch, var(--destructive) 50%, transparent)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px color-mix(in oklch, var(--destructive) 80%, transparent)); }
  30% { transform: scale(1); }
}
.animate-footer-breathe { animation: footer-breathe 8s ease-in-out infinite alternate; }
.animate-footer-scroll-marquee { animation: footer-scroll-marquee 40s linear infinite; }
.animate-footer-heartbeat { animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite; }
@media (prefers-reduced-motion: reduce) {
  .animate-footer-breathe, .animate-footer-scroll-marquee, .animate-footer-heartbeat { animation: none; }
}
.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--foreground) 3%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}
.footer-aurora {
  background: radial-gradient(circle at 50% 50%, color-mix(in oklch, var(--primary) 15%, transparent) 0%, color-mix(in oklch, var(--secondary) 15%, transparent) 40%, transparent 70%);
}
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 0 10px 30px -10px var(--pill-shadow), inset 0 1px 1px var(--pill-highlight), inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 0 20px 40px -10px var(--pill-shadow-hover), inset 0 1px 1px var(--pill-highlight-hover);
  color: var(--foreground);
}
.footer-giant-bg-text {
  font-family: var(--font-display);
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--foreground) 5%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--foreground) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}
.footer-giant-bg-text.is-rgb {
  -webkit-text-stroke: 1px color-mix(in oklch, var(--primary) 70%, transparent);
  background: none;
}
.footer-giant-bg-text.is-secret { font-stretch: 62%; font-variation-settings: "wdth" 62; }
.footer-text-glow {
  background: linear-gradient(180deg, var(--foreground) 0%, color-mix(in oklch, var(--foreground) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--foreground) 15%, transparent));
}
`;

// 2. MAGNETIC BUTTON PRIMITIVE (from the provided component)
export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { as?: React.ElementType };

export const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      const element = localRef.current;
      if (!element || prefersReducedMotion()) return;

      const handleMouseMove = (e: MouseEvent) => {
        const rect = element.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(element, { x: x * 0.4, y: y * 0.4, rotationX: -y * 0.15, rotationY: x * 0.15, scale: 1.05, ease: "power2.out", duration: 0.4 });
      };
      const handleMouseLeave = () => {
        gsap.to(element, { x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1, ease: "elastic.out(1, 0.3)", duration: 1.2 });
      };

      element.addEventListener("mousemove", handleMouseMove);
      element.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        element.removeEventListener("mousemove", handleMouseMove);
        element.removeEventListener("mouseleave", handleMouseLeave);
        gsap.killTweensOf(element);
      };
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
MagneticButton.displayName = "MagneticButton";

// 3. GLITCH SWAP — ELANG briefly becomes CLARITYS
type GlitchSwapProps = {
  primary: string;
  secret: string;
  trigger: React.RefObject<HTMLElement | null>;
  minDelay?: number;
  maxDelay?: number;
};

export function GlitchSwap({ primary, secret, trigger, minDelay = 7000, maxDelay = 12000 }: GlitchSwapProps) {
  const primaryRef = useRef<HTMLSpanElement>(null);
  const rgbRef = useRef<HTMLSpanElement>(null);
  const secretRef = useRef<HTMLSpanElement>(null);
  const secretInnerRef = useRef<HTMLSpanElement>(null);

  // Keep CLARITYS inside ELANG's box: no layout shift, no overflow.
  useEffect(() => {
    const fit = () => {
      if (!primaryRef.current || !secretInnerRef.current) return;
      gsap.set(secretInnerRef.current, { scaleX: 1 });
      gsap.set(secretInnerRef.current, { scaleX: fitScaleX(primaryRef.current.offsetWidth, secretInnerRef.current.scrollWidth) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (primaryRef.current) ro.observe(primaryRef.current);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [primary, secret]);

  useGSAP(() => {
    const p = primaryRef.current!;
    const rgb = rgbRef.current!;
    const s = secretRef.current!;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = false;
    const mm = gsap.matchMedia();

    mm.add(NO_REDUCED, () => {
      const glitch = () =>
        gsap
          .timeline()
          .set(rgb, { autoAlpha: 0.8, x: "-0.4vw" })
          .to(p, { clipPath: sliceInset(), x: "3vw", duration: 0.05, ease: "none" })
          .to(p, { clipPath: sliceInset(), x: "-2vw", duration: 0.05, ease: "none" })
          .set(p, { autoAlpha: 0, clipPath: "inset(0% 0 0% 0)", x: 0 })
          .set(s, { autoAlpha: 1, clipPath: sliceInset() })
          .to(s, { clipPath: "inset(0% 0 0% 0)", x: "1.5vw", duration: 0.04, ease: "none" })
          .to(s, { x: 0, duration: 0.04, ease: "none" })
          .to({}, { duration: 0.18 })
          .set(s, { autoAlpha: 0 })
          .set(p, { autoAlpha: 1, clipPath: sliceInset(), x: "-3vw" })
          .to(p, { clipPath: "inset(0% 0 0% 0)", x: 0, duration: 0.06, ease: "none" })
          .set(rgb, { autoAlpha: 0, x: 0 });

      const schedule = (delay: number) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          if (active && document.visibilityState === "visible") glitch();
          if (active) schedule(nextGlitchDelay(minDelay, maxDelay));
        }, delay);
      };

      const st = ScrollTrigger.create({
        trigger: trigger.current,
        start: "top 40%",
        end: "bottom top",
        onToggle: (self) => {
          active = self.isActive;
          if (active) schedule(700); // first glitch right after the footer finishes its reveal
          else clearTimeout(timer);
        },
      });
      return () => {
        clearTimeout(timer);
        st.kill();
      };
    });

    mm.add("(prefers-reduced-motion: reduce)", () => {
      ScrollTrigger.create({
        trigger: trigger.current,
        start: "top 40%",
        once: true,
        onEnter: () =>
          gsap
            .timeline({ delay: 0.5 })
            .to(p, { autoAlpha: 0, duration: 0.15 })
            .to(s, { autoAlpha: 1, duration: 0.15 }, "<")
            .to(s, { autoAlpha: 0, duration: 0.15 }, "+=0.6")
            .to(p, { autoAlpha: 1, duration: 0.15 }, "<"),
      });
    });

    return () => mm.revert();
  });

  return (
    <span className="relative block" aria-hidden>
      <span ref={primaryRef} className="footer-giant-bg-text block">
        {primary}
      </span>
      <span ref={rgbRef} className="footer-giant-bg-text is-rgb invisible absolute inset-0 block">
        {primary}
      </span>
      <span ref={secretRef} className="invisible absolute inset-0 flex justify-center">
        <span ref={secretInnerRef} className="footer-giant-bg-text is-secret inline-block origin-center whitespace-nowrap">
          {secret}
        </span>
      </span>
    </span>
  );
}

// 4. MAIN COMPONENT
export type FooterLink = { label: string; href: string; icon?: "github" | "mail" | "instagram"; external?: boolean };
export type CinematicFooterProps = {
  giantText: string;
  secretText: string;
  marquee: string[];
  heading: string;
  primaryLinks: FooterLink[];
  secondaryLinks: FooterLink[];
  copyright: string;
  creditName: string;
};

const ICONS = {
  github: GithubIcon,
  instagram: InstagramIcon,
  mail: ({ className }: { className?: string }) => <Mail className={className} aria-hidden />,
};

function MarqueeItem({ items }: { items: string[] }) {
  return (
    <div className="flex items-center space-x-12 px-6">
      {items.map((item, i) => (
        <React.Fragment key={`${item}-${i}`}>
          <span>{item}</span>
          <span className={i % 2 ? "text-foreground/30" : "text-primary/60"}>✦</span>
        </React.Fragment>
      ))}
    </div>
  );
}

const linkProps = (l: FooterLink) => (l.external ? { href: l.href, target: "_blank", rel: "noopener noreferrer" } : { href: l.href });

export function CinematicFooter(props: CinematicFooterProps) {
  const { giantText, secretText, marquee, heading, primaryLinks, secondaryLinks, copyright, creditName } = props;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        gsap.fromTo(
          giantTextRef.current,
          { y: "10vh", scale: 0.8, opacity: 0 },
          { y: "0vh", scale: 1, opacity: 1, ease: "power1.out", scrollTrigger: { trigger: wrapperRef.current, start: "top 80%", end: "bottom bottom", scrub: 1 } },
        );
        gsap.fromTo(
          [headingRef.current, linksRef.current],
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, stagger: 0.15, ease: "power3.out", scrollTrigger: { trigger: wrapperRef.current, start: "top 40%", end: "bottom bottom", scrub: 1 } },
        );
      });
      return () => mm.revert();
    },
    { scope: wrapperRef },
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      {/* Curtain reveal: the fixed footer is only visible inside this clipped box. */}
      <div ref={wrapperRef} className="relative h-svh min-h-[640px] w-full" style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}>
        <footer className="cinematic-footer-wrapper fixed bottom-0 left-0 flex h-svh min-h-[640px] w-full flex-col justify-between overflow-hidden bg-background text-foreground">
          <div className="footer-aurora animate-footer-breathe pointer-events-none absolute left-1/2 top-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[80px]" />
          <div className="footer-bg-grid pointer-events-none absolute inset-0 z-0" />

          <div ref={giantTextRef} className="pointer-events-none absolute -bottom-[5vh] left-1/2 z-0 -translate-x-1/2 select-none whitespace-nowrap">
            <GlitchSwap primary={giantText} secret={secretText} trigger={wrapperRef} />
          </div>

          <div className="absolute left-0 top-12 z-10 w-full -rotate-2 scale-110 overflow-hidden border-y border-border/50 bg-background/60 py-4 shadow-2xl backdrop-blur-md">
            <div className="animate-footer-scroll-marquee flex w-max font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground md:text-xs">
              <MarqueeItem items={marquee} />
              <MarqueeItem items={marquee} />
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-20 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-4 md:px-6">
            <h2 ref={headingRef} className="footer-text-glow mb-10 text-center font-display text-5xl font-black tracking-tighter md:mb-12 md:text-8xl">
              {heading}
            </h2>
            <div ref={linksRef} className="flex w-full flex-col items-center gap-6">
              <div className="flex w-full flex-wrap justify-center gap-3 md:gap-4">
                {primaryLinks.map((l) => {
                  const Icon = l.icon ? ICONS[l.icon] : null;
                  return (
                    <MagneticButton key={l.href} as="a" {...linkProps(l)} className="footer-glass-pill group flex items-center gap-3 rounded-full px-7 py-4 text-sm font-bold text-foreground md:px-10 md:py-5 md:text-base">
                      {Icon && <Icon className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground md:h-6 md:w-6" />}
                      {l.label}
                    </MagneticButton>
                  );
                })}
              </div>
              <div className="mt-2 flex w-full flex-wrap justify-center gap-3 md:gap-6">
                {secondaryLinks.map((l) => (
                  <MagneticButton key={l.href} as="a" {...linkProps(l)} className="footer-glass-pill rounded-full px-6 py-3 text-xs font-medium text-muted-foreground hover:text-foreground md:text-sm">
                    {l.label}
                  </MagneticButton>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-20 flex w-full flex-col items-center justify-between gap-6 px-4 pb-8 md:flex-row md:px-12">
            <div className="order-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground md:order-1 md:text-xs">{copyright}</div>
            <div className="footer-glass-pill order-1 flex cursor-default items-center gap-2 rounded-full border-border/50 px-6 py-3 md:order-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">Crafted with</span>
              <span className="animate-footer-heartbeat text-sm text-destructive md:text-base">❤</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground md:text-xs">by</span>
              <span className="ml-1 text-xs font-black tracking-normal text-foreground md:text-sm">{creditName}</span>
            </div>
            <MagneticButton as="button" type="button" onClick={scrollToTop} aria-label="Back to top" className="footer-glass-pill group order-3 flex h-12 w-12 items-center justify-center rounded-full text-muted-foreground hover:text-foreground">
              <svg className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}
```

- [ ] **Step 4: Render it from the site layout.** In `src/app/(site)/layout.tsx`, fetch the extra data and replace the `{/* footer: Task 8 */}` slot:

```tsx
import { CinematicFooter } from "@/components/ui/motion-footer";
import { getCategoryStats, getCompetitions } from "@/lib/data/writeups";
// ...
const [profile, stats, competitions] = await Promise.all([getProfile(), getCategoryStats(), getCompetitions()]);
const primaryLinks = [
  profile.githubUrl && { label: "GitHub", href: profile.githubUrl, icon: "github" as const, external: true },
  profile.email && { label: "Email me", href: `mailto:${profile.email}`, icon: "mail" as const },
].filter(Boolean) as { label: string; href: string; icon: "github" | "mail"; external?: boolean }[];
const secondaryLinks = [
  ...(profile.instagramUrl ? [{ label: "Instagram", href: profile.instagramUrl, external: true }] : []),
  { label: "Writeups", href: "/writeups" },
  { label: "Projects", href: "/projects" },
];
// ...
<CinematicFooter
  giantText="ELANG"
  secretText={profile.alias.toUpperCase()}
  marquee={[...stats.map((s) => s.category.toUpperCase()), ...competitions.slice(0, 6)]}
  heading="Got a binary for me?"
  primaryLinks={primaryLinks}
  secondaryLinks={secondaryLinks}
  copyright={`© ${new Date().getFullYear()} ${profile.displayName}`}
  creditName={profile.alias}
/>
```

- [ ] **Step 5: Visual verification (sandbox disabled).** Run `pnpm dev`. With the Playwright MCP, open `http://localhost:3000`, scroll to the bottom, and wait 1.5 s.
  - Take two screenshots about 300 ms apart around the first glitch. Expect ELANG, then a frame where CLARITYS or slice artefacts appear.
  - Expect no horizontal scrollbar: `document.documentElement.scrollWidth === innerWidth`.
  - Repeat with `browser_emulate_media` `reducedMotion: "reduce"`. Expect the marquee static and a single crossfade.

- [ ] **Step 6: Commit**

```bash
pnpm test && pnpm typecheck && pnpm lint
git add -A && git commit -m "feat(footer): cinematic footer with ELANG→CLARITYS glitch foreshadow

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Contact section and `/api/contact`

**Files:**
- Create: `src/lib/contact.ts`, `src/app/api/contact/route.ts`, `src/components/site/contact-section.tsx`
- Modify: `src/app/(site)/layout.tsx` (render `<ContactSection />` after `{children}` inside `#content`)
- Test: `tests/unit/contact.test.ts`, `tests/unit/contact-route.test.ts`

**Interfaces:**
- Produces:
  - `@/lib/contact`: `ContactSchema` (zod: `name` 1–80, `contact` 3–120, `subject` optional ≤120, `message` 10–4000, `website` honeypot string optional), `type ContactInput`, `formatContactMessage(i: ContactInput): { title: string; content: string; username: string; source: "contact-form" }`.
  - `POST /api/contact`: 201 `{ok:true}` on success *and* when the honeypot is filled (nothing stored); 422 `{error, fields}` on validation errors; 429 when rate-limited (3 / 10 min / IP); 400 on non-JSON.

- [ ] **Step 1: Failing tests**

`tests/unit/contact.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { ContactSchema, formatContactMessage } from "@/lib/contact";

describe("contact", () => {
  it("formats in the legacy shape", () => {
    expect(formatContactMessage({ name: "Rin", contact: "rin@x.dev", message: "Let's team up for SCTF" })).toEqual({
      title: "Message from Rin",
      content: "From: Rin (rin@x.dev)\n\nLet's team up for SCTF",
      username: "Rin",
      source: "contact-form",
    });
    expect(formatContactMessage({ name: "Rin", contact: "@rin", subject: "CTF team", message: "0123456789" }).title).toBe("CTF team");
  });
  it("validates lengths", () => {
    expect(ContactSchema.safeParse({ name: "", contact: "x", message: "short" }).success).toBe(false);
    expect(ContactSchema.safeParse({ name: "a", contact: "abc", message: "x".repeat(4001) }).success).toBe(false);
    expect(ContactSchema.safeParse({ name: "a", contact: "abc", message: "long enough message" }).success).toBe(true);
  });
});
```

`tests/unit/contact-route.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn().mockResolvedValue({ id: "1" });
vi.mock("@/lib/db", () => ({ prisma: { secureMessage: { create } } }));

const post = async (body: unknown, ip = "9.9.9.9") => {
  const { POST } = await import("@/app/api/contact/route");
  return POST(new Request("http://x/api/contact", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: typeof body === "string" ? body : JSON.stringify(body) }));
};
const valid = { name: "Rin", contact: "rin@x.dev", message: "Let's team up for SCTF" };

beforeEach(() => create.mockClear());

describe("POST /api/contact", () => {
  it("stores a valid message", async () => {
    expect((await post(valid, "1.1.1.1")).status).toBe(201);
    expect(create).toHaveBeenCalledWith({ data: expect.objectContaining({ source: "contact-form", username: "Rin" }) });
  });
  it("pretends success but stores nothing when the honeypot is filled", async () => {
    expect((await post({ ...valid, website: "http://spam" }, "2.2.2.2")).status).toBe(201);
    expect(create).not.toHaveBeenCalled();
  });
  it("422 on invalid, 400 on garbage", async () => {
    expect((await post({ ...valid, message: "hi" }, "3.3.3.3")).status).toBe(422);
    expect((await post("{not json", "4.4.4.4")).status).toBe(400);
  });
  it("429 on the 4th message within the window", async () => {
    const codes = [];
    for (let i = 0; i < 4; i++) codes.push((await post(valid, "5.5.5.5")).status);
    expect(codes).toEqual([201, 201, 201, 429]);
  });
});
```

Run: FAIL.

- [ ] **Step 2: `src/lib/contact.ts`**

```ts
import { z } from "zod";

export const ContactSchema = z.object({
  name: z.string().trim().min(1, "Tell me your name").max(80),
  contact: z.string().trim().min(3, "Email or handle so I can reply").max(120),
  subject: z.string().trim().max(120).optional(),
  message: z.string().trim().min(10, "A bit more detail, please").max(4000),
  website: z.string().optional(),
});

export type ContactInput = z.infer<typeof ContactSchema>;

export function formatContactMessage(i: ContactInput) {
  return {
    title: i.subject?.trim() || `Message from ${i.name}`,
    content: `From: ${i.name} (${i.contact})\n\n${i.message}`,
    username: i.name,
    source: "contact-form" as const,
  };
}
```

- [ ] **Step 3: `src/app/api/contact/route.ts`**

```ts
import { z } from "zod";
import { ContactSchema, formatContactMessage } from "@/lib/contact";
import { prisma } from "@/lib/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export const runtime = "nodejs";
const limiter = createRateLimiter({ limit: 3, windowMs: 10 * 60 * 1000 });

export async function POST(req: Request) {
  const body = await req.json().catch(() => undefined);
  if (body === undefined) return Response.json({ error: "Bad request." }, { status: 400 });

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors }, { status: 422 });
  if (parsed.data.website) return Response.json({ ok: true }, { status: 201 });

  const gate = limiter.hit(clientIp(req.headers));
  if (!gate.ok) return Response.json({ error: "Too many messages. Try again later." }, { status: 429, headers: { "Retry-After": String(gate.retryAfter) } });

  await prisma.secureMessage.create({ data: formatContactMessage(parsed.data) });
  return Response.json({ ok: true }, { status: 201 });
}
```

Run: `pnpm test`. Expected: PASS.

- [ ] **Step 4: `src/components/site/contact-section.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { SectionLabel } from "@/components/site/section-label";

type Status = { kind: "idle" | "sending" | "sent" } | { kind: "error"; message: string; fields?: Record<string, string[]> };

const field = "w-full border-0 border-b border-border bg-transparent py-3 text-lg outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary";

export function ContactSection() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus({ kind: "sending" });
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    if (res?.status === 201) {
      setStatus({ kind: "sent" });
      return;
    }
    const json = await res?.json().catch(() => ({}));
    setStatus({ kind: "error", message: json?.error ?? "Network error. Try email instead.", fields: json?.fields });
  }

  const err = (name: string) => (status.kind === "error" ? status.fields?.[name]?.[0] : undefined);

  return (
    <section id="contact" className="mx-auto grid max-w-[1600px] gap-12 border-t border-border px-4 py-24 md:grid-cols-12 md:px-8 md:py-36">
      <div className="md:col-span-5">
        <SectionLabel index={5} name="contact" />
        <h2 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-tight md:text-7xl">Say hi.</h2>
        <p className="mt-6 max-w-sm text-muted-foreground">CTF team invites, collabs, or a challenge you think I can&apos;t pwn. I read everything.</p>
      </div>
      <Reveal className="md:col-span-6 md:col-start-7">
        {status.kind === "sent" ? (
          <p className="font-display text-3xl" role="status">
            Received. I&apos;ll get back to you soon.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="grid gap-8" noValidate>
            <div className="grid gap-8 md:grid-cols-2">
              <label className="grid gap-1">
                <span className="meta">name</span>
                <input name="name" required maxLength={80} className={field} aria-invalid={!!err("name")} />
                {err("name") && <span className="text-sm text-destructive">{err("name")}</span>}
              </label>
              <label className="grid gap-1">
                <span className="meta">email / handle</span>
                <input name="contact" required maxLength={120} className={field} aria-invalid={!!err("contact")} />
                {err("contact") && <span className="text-sm text-destructive">{err("contact")}</span>}
              </label>
            </div>
            <label className="grid gap-1">
              <span className="meta">message</span>
              <textarea name="message" required rows={4} maxLength={4000} className={`${field} resize-none`} aria-invalid={!!err("message")} />
              {err("message") && <span className="text-sm text-destructive">{err("message")}</span>}
            </label>
            {/* Honeypot: hidden from people, filled by bots. */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
            <div className="flex items-center gap-6">
              <button type="submit" disabled={status.kind === "sending"} className="rounded-full bg-primary px-8 py-4 font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60">
                {status.kind === "sending" ? "Sending…" : "Send message"}
              </button>
              {status.kind === "error" && (
                <p className="text-sm text-destructive" role="alert">
                  {status.message}
                </p>
              )}
            </div>
          </form>
        )}
      </Reveal>
    </section>
  );
}
```

Update `src/app/(site)/layout.tsx`:
```tsx
<div id="content" className="relative z-10 bg-background">
  {children}
  <ContactSection />
</div>
```

- [ ] **Step 5: Commit**

```bash
pnpm test && pnpm typecheck && pnpm lint
git add -A && git commit -m "feat(contact): contact section with honeypot and rate-limited API

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Home page sections

**Files:**
- Create: `src/components/site/hero.tsx`, `src/components/site/about-short.tsx`, `src/components/site/writeup-index.tsx`, `src/components/site/hover-preview.tsx`, `src/components/site/category-stats.tsx`, `src/components/site/project-rail.tsx`, `src/components/site/record-timeline.tsx`, `src/components/site/quote.tsx`
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: data functions (Task 3), motion primitives (Task 7), `Media`, `SectionLabel`.
- Produces:
  - `<Hero name alias role location school />`
  - `<AboutShort text imageUrl />`
  - `<WriteupIndex items={WriteupSummary[]} numbered />` (reused on `/writeups`)
  - `<CategoryStats stats={{category,count}[]} />`
  - `<ProjectRail projects={ProjectItem[]} />`
  - `<RecordTimeline items={AchievementItem[]} limit? />` (reused on `/achievements`)
  - `<Quote text />`
  - `formatDate(iso: string | null, style?: "short" | "year")` exported from `writeup-index.tsx`

- [ ] **Step 1: Hero** (`src/components/site/hero.tsx`)

```tsx
import { ScrambleLine } from "@/components/motion/scramble-line";
import { SplitHeading } from "@/components/motion/split-heading";

type Props = { name: string; alias: string; role: string; location: string; school: string };

export function Hero({ name, alias, role, location, school }: Props) {
  const [first, ...rest] = name.toUpperCase().split(" ");
  return (
    <section className="relative mx-auto flex min-h-svh max-w-[1600px] flex-col justify-end px-4 pb-10 pt-28 md:px-8 md:pb-14">
      <div className="mb-10 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
        <p className="meta">
          aka <span className="text-foreground">{alias}</span>
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground md:text-right">
          <dt>based</dt>
          <dd className="text-foreground">{location}</dd>
          <dt>school</dt>
          <dd className="text-foreground">{school}</dd>
          <dt>status</dt>
          <dd className="text-foreground">open to CTF teams</dd>
        </dl>
      </div>
      <SplitHeading as="h1" text={first} className="font-display text-[22vw] font-black leading-[0.8] tracking-[-0.05em] md:text-[17vw]" />
      <SplitHeading as="p" text={rest.join(" ")} delay={0.15} className="font-display text-[11vw] font-light leading-[0.9] tracking-[-0.04em] [font-stretch:125%] md:text-[8.5vw]" />
      <div className="mt-10 flex items-center justify-between border-t border-border pt-5">
        <ScrambleLine text={role} className="font-mono text-sm tracking-[0.2em] md:text-base" />
        <span className="meta hidden md:inline">scroll ↓</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: About short + quote** (word-by-word scrub)

`src/components/site/about-short.tsx`:
```tsx
"use client";

import { useGSAP } from "@gsap/react";
import Link from "next/link";
import { useRef } from "react";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

export function AboutShort({ text, imageUrl }: { text: string; imageUrl: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const split = SplitText.create(".about-copy", { type: "words" });
        gsap.fromTo(split.words, { opacity: 0.15 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: ".about-copy", start: "top 75%", end: "bottom 45%", scrub: true } });
        gsap.fromTo(".about-photo", { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", ease: "expo.out", duration: 1.4, scrollTrigger: { trigger: ".about-photo", start: "top 80%", once: true } });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <section ref={ref} className="mx-auto grid max-w-[1600px] gap-10 px-4 py-24 md:grid-cols-12 md:px-8 md:py-40">
      <SectionLabel index={1} name="about" className="md:col-span-12" />
      <p className="about-copy font-display text-3xl font-medium leading-[1.12] tracking-tight md:col-span-8 md:text-5xl">{text}</p>
      <div className="flex flex-col gap-4 md:col-span-3 md:col-start-10">
        <Media src={imageUrl} alt="Portrait of Elang" className="about-photo aspect-[3/4] w-full grayscale" />
        <Link href="/about" className="meta w-fit border-b border-primary pb-1 text-foreground">
          more about me →
        </Link>
      </div>
    </section>
  );
}
```

The home page passes `text` = the first two sentences of `profile.aboutText`: `aboutText.split(/(?<=\.)\s+/).slice(0, 2).join(" ")`.

`src/components/site/quote.tsx`:
```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED, SplitText } from "@/lib/motion";

export function Quote({ text }: { text: string }) {
  const ref = useRef<HTMLQuoteElement>(null);
  const match = /^(.*?)["”]?\s*[-–—]\s*([^-–—]+)$/.exec(text.trim());
  const body = (match ? match[1] : text).replace(/^["“]|["”]$/g, "");
  const author = match?.[2]?.trim();
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        const split = SplitText.create(ref.current!.querySelector("p")!, { type: "words" });
        gsap.from(split.words, { autoAlpha: 0, y: 20, stagger: 0.06, ease: "power2.out", scrollTrigger: { trigger: ref.current, start: "top 70%", end: "center 50%", scrub: true } });
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  if (!text) return null;
  return (
    <blockquote ref={ref} className="mx-auto flex min-h-[80svh] max-w-[1400px] flex-col justify-center px-4 py-24 md:px-8">
      <p className="font-display text-5xl font-light italic leading-[1] tracking-tight md:text-8xl">“{body}”</p>
      {author && <footer className="meta mt-8">— {author}</footer>}
    </blockquote>
  );
}
```

- [ ] **Step 3: Writeup index + hover preview + stats**

`src/components/site/hover-preview.tsx` (cursor-following image; pointer devices only):
```tsx
"use client";

import { useEffect, useRef } from "react";
import { gsap, prefersReducedMotion } from "@/lib/motion";

export function HoverPreview({ src }: { src: string | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current!;
    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
    const move = (e: PointerEvent) => {
      xTo(e.clientX + 24);
      yTo(e.clientY - 120);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);
  useEffect(() => {
    gsap.to(ref.current, { autoAlpha: src ? 1 : 0, scale: src ? 1 : 0.9, duration: prefersReducedMotion() ? 0 : 0.3 });
  }, [src]);
  return (
    <div ref={ref} className="pointer-events-none fixed left-0 top-0 z-40 hidden h-48 w-72 overflow-hidden rounded-sm opacity-0 shadow-2xl [@media(pointer:fine)]:block" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="h-full w-full object-cover" />}
    </div>
  );
}
```

`src/components/site/writeup-index.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { HoverPreview } from "@/components/site/hover-preview";
import type { WriteupSummary } from "@/lib/types";

export function formatDate(iso: string | null, style: "short" | "year" = "short") {
  if (!iso) return "Undated";
  const d = new Date(iso);
  return style === "year" ? String(d.getUTCFullYear()) : new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(d);
}

export function WriteupIndex({ items, numbered = true }: { items: WriteupSummary[]; numbered?: boolean }) {
  const [hover, setHover] = useState<string | null>(null);
  if (items.length === 0) return <p className="meta py-12">no writeups match.</p>;
  return (
    <>
      <HoverPreview src={hover} />
      <Reveal as="ol" stagger y={20} className="border-t border-border">
        {items.map((w, i) => (
          <li key={w.id} className="border-b border-border">
            <Link
              href={w.href}
              onPointerEnter={() => setHover(w.cover)}
              onPointerLeave={() => setHover(null)}
              className="group grid grid-cols-[2.5rem_1fr] items-baseline gap-x-4 gap-y-1 py-5 transition-colors md:grid-cols-[3rem_1fr_10rem_10rem_7rem] md:py-6"
            >
              <span className="font-mono text-xs text-muted-foreground">{numbered ? String(i + 1).padStart(2, "0") : ""}</span>
              <span className="font-display text-2xl font-semibold tracking-tight transition-transform duration-500 group-hover:translate-x-2 group-hover:text-primary md:text-4xl">{w.title}</span>
              <span className="meta col-start-2 md:col-start-auto">
                {w.category}
                {w.difficulty ? ` · ${w.difficulty}` : ""}
              </span>
              <span className="meta col-start-2 md:col-start-auto">{w.competition || "—"}</span>
              <span className="meta col-start-2 md:col-start-auto md:text-right">{formatDate(w.date)}</span>
            </Link>
          </li>
        ))}
      </Reveal>
    </>
  );
}
```

`src/components/site/category-stats.tsx` (count-up when visible):
```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { gsap, NO_REDUCED } from "@/lib/motion";

export function CategoryStats({ stats }: { stats: { category: string; count: number }[] }) {
  const ref = useRef<HTMLDListElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(NO_REDUCED, () => {
        ref.current!.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
          const end = Number(el.dataset.count);
          const obj = { v: 0 };
          gsap.to(obj, { v: end, duration: 1.4, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%", once: true }, onUpdate: () => (el.textContent = String(Math.round(obj.v)).padStart(2, "0")) });
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
  return (
    <dl ref={ref} className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s, i) => (
        <div key={s.category} className="bg-background p-5 md:p-6">
          <dt className="meta">{s.category}</dt>
          <dd data-count={s.count} className={`mt-3 font-display text-6xl font-black tabular-nums tracking-tight md:text-7xl ${i === 0 ? "text-primary" : ""}`}>
            {String(s.count).padStart(2, "0")}
          </dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 4: Project rail** (pinned horizontal scroll on md+; a vertical stack on mobile and reduced motion)

`src/components/site/project-rail.tsx`:
```tsx
"use client";

import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { gsap, NO_REDUCED } from "@/lib/motion";
import type { ProjectItem } from "@/lib/types";

export function ProjectRail({ projects }: { projects: ProjectItem[] }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${NO_REDUCED} and (min-width: 768px)`, () => {
        const distance = () => track.current!.scrollWidth - window.innerWidth;
        gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: { trigger: section.current, pin: true, scrub: 1, end: () => `+=${distance()}`, invalidateOnRefresh: true },
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );
  return (
    <section ref={section} className="overflow-hidden py-24 md:flex md:h-svh md:flex-col md:justify-center md:py-0">
      <div className="mx-auto mb-10 flex w-full max-w-[1600px] items-end justify-between px-4 md:px-8">
        <SectionLabel index={3} name="projects" />
        <span className="meta">{String(projects.length).padStart(2, "0")} selected</span>
      </div>
      <div ref={track} className="flex flex-col gap-10 px-4 md:w-max md:flex-row md:gap-8 md:px-8">
        {projects.map((p, i) => (
          <a
            key={p.id}
            href={p.projectUrl ?? "/projects"}
            {...(p.projectUrl?.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="group block md:w-[56vw] lg:w-[44vw]"
          >
            <div className="overflow-hidden">
              <Media src={p.imageUrl} alt={p.title} className="aspect-[16/10] w-full transition-transform duration-700 group-hover:scale-[1.03]" />
            </div>
            <div className="mt-4 flex items-baseline justify-between gap-6">
              <h3 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                <span className="mr-3 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                {p.title}
              </h3>
              <span className="meta shrink-0">{p.category}</span>
            </div>
            <p className="mt-2 line-clamp-2 max-w-xl text-sm text-muted-foreground">{p.description}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Record timeline** (`src/components/site/record-timeline.tsx`). Items are grouped by year; the top 3 by proofScore are rendered large.

```tsx
import { Reveal } from "@/components/motion/reveal";
import { formatDate } from "@/components/site/writeup-index";
import type { AchievementItem } from "@/lib/types";

export function RecordTimeline({ items, limit }: { items: AchievementItem[]; limit?: number }) {
  const shown = limit ? [...items].sort((a, b) => b.proofScore - a.proofScore).slice(0, limit).sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")) : items;
  const top = new Set([...shown].sort((a, b) => b.proofScore - a.proofScore).slice(0, 3).map((a) => a.id));
  const groups = new Map<string, AchievementItem[]>();
  for (const a of shown) {
    const k = a.year ? String(a.year) : "Undated";
    groups.set(k, [...(groups.get(k) ?? []), a]);
  }
  return (
    <div className="grid gap-16">
      {[...groups.entries()].map(([year, list]) => (
        <div key={year} className="grid gap-6 md:grid-cols-12">
          <h3 className="font-display text-6xl font-black tracking-tight text-muted-foreground/40 md:sticky md:top-24 md:col-span-3 md:self-start md:text-8xl">{year}</h3>
          <Reveal as="ul" stagger y={16} className="md:col-span-9">
            {list.map((a) => (
              <li key={a.id} className="grid gap-1 border-b border-border py-5 md:grid-cols-[1fr_auto] md:gap-8">
                <div>
                  <p className={top.has(a.id) ? "font-display text-2xl font-semibold tracking-tight md:text-3xl" : "text-lg"}>{a.title}</p>
                  <p className="meta mt-1">{a.issuer ?? a.platform ?? "Independent"}</p>
                </div>
                <span className="meta md:text-right">{formatDate(a.date)}</span>
              </li>
            ))}
          </Reveal>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Compose the home page** (`src/app/(site)/page.tsx`)

```tsx
import Link from "next/link";
import { AboutShort } from "@/components/site/about-short";
import { CategoryStats } from "@/components/site/category-stats";
import { Hero } from "@/components/site/hero";
import { ProjectRail } from "@/components/site/project-rail";
import { Quote } from "@/components/site/quote";
import { RecordTimeline } from "@/components/site/record-timeline";
import { SectionLabel } from "@/components/site/section-label";
import { WriteupIndex } from "@/components/site/writeup-index";
import { listAchievements } from "@/lib/data/achievements";
import { getProfile } from "@/lib/data/profile";
import { listProjects } from "@/lib/data/projects";
import { getCategoryStats, listWriteups } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [profile, writeups, stats, projects, achievements] = await Promise.all([getProfile(), listWriteups(), getCategoryStats(), listProjects(), listAchievements()]);
  const school = profile.education.at(-1)?.school ?? "SMK Telkom Malang";
  const intro = profile.aboutText.split(/(?<=\.)\s+/).slice(0, 2).join(" ");

  return (
    <main>
      <Hero name={profile.displayName} alias={profile.alias} role="pwn · rev · forensics" location="Malang, ID" school={school} />
      {intro && <AboutShort text={intro} imageUrl={profile.profileImageUrl} />}

      <section className="mx-auto max-w-[1600px] px-4 py-24 md:px-8 md:py-36">
        <div className="mb-12 flex items-end justify-between">
          <SectionLabel index={2} name="writeups" />
          <Link href="/writeups" className="meta border-b border-primary pb-1 text-foreground">
            all {writeups.length} →
          </Link>
        </div>
        <CategoryStats stats={stats} />
        <div className="mt-16">
          <WriteupIndex items={writeups.slice(0, 8)} />
        </div>
      </section>

      {projects.length > 0 && <ProjectRail projects={projects} />}

      <section className="mx-auto max-w-[1600px] px-4 py-24 md:px-8 md:py-36">
        <div className="mb-16 flex items-end justify-between">
          <SectionLabel index={4} name="record" />
          <Link href="/achievements" className="meta border-b border-primary pb-1 text-foreground">
            full record →
          </Link>
        </div>
        <RecordTimeline items={achievements} limit={10} />
      </section>

      <Quote text={profile.philosophyText} />
    </main>
  );
}
```

- [ ] **Step 7: Visual check and commit (sandbox disabled).** Run `pnpm dev`. With Playwright MCP, screenshot `/` at 1440×900 and at 390×844 (full page).
  - The hero name must not overflow horizontally at 390px. Check `document.documentElement.scrollWidth <= innerWidth`.
  - The pinned project rail scrolls horizontally at 1440, and the cards stack at 390.

```bash
pnpm typecheck && pnpm lint
git add -A && git commit -m "feat(home): hero, about, writeup index, project rail, record, quote

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Writeups index, article page, flag reveal, legacy redirects

**Files:**
- Create: `src/app/(site)/writeups/page.tsx`, `src/components/site/writeup-filter.tsx`, `src/app/(site)/writeups/[slug]/page.tsx`, `src/components/site/flag-reveal.tsx`, `src/components/site/toc.tsx`, `src/app/ctf/[id]/page.tsx`
- Modify: `src/app/globals.css` (article prose styles)

**Interfaces:**
- Consumes: `listWriteups`, `getWriteup`, `getAdjacentWriteups`, `renderWriteupHtml`, `WriteupIndex`, `formatDate`, `SplitHeading`, `SectionLabel`, `Media`.
- Produces: routes `/writeups`, `/writeups/[slug]` (also resolves uuid), `/ctf/[id]` → 308.

- [ ] **Step 1: Filterable index** (`src/components/site/writeup-filter.tsx`)

```tsx
"use client";

import { useMemo, useState } from "react";
import { WriteupIndex } from "@/components/site/writeup-index";
import type { WriteupSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WriteupFilter({ items, categories }: { items: WriteupSummary[]; categories: string[] }) {
  const [cat, setCat] = useState<string>("All");
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter(
      (w) =>
        (cat === "All" || w.category === cat) &&
        (!needle || [w.title, w.competition, w.summary, ...w.tags].join(" ").toLowerCase().includes(needle)),
    );
  }, [items, cat, q]);
  return (
    <>
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              className={cn("rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors", cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}
            >
              {c}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search title, ctf, tag…"
          aria-label="Search writeups"
          className="w-full border-0 border-b border-border bg-transparent py-2 font-mono text-sm outline-none focus:border-primary md:w-72"
        />
      </div>
      <p className="meta mb-4">{filtered.length} results</p>
      <WriteupIndex items={filtered} />
    </>
  );
}
```

`src/app/(site)/writeups/page.tsx`:
```tsx
import type { Metadata } from "next";
import { SplitHeading } from "@/components/motion/split-heading";
import { SectionLabel } from "@/components/site/section-label";
import { WriteupFilter } from "@/components/site/writeup-filter";
import { getCategoryStats, listWriteups } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Writeups", description: "CTF writeups — mostly pwn, plus reverse engineering and forensics." };

export default async function WriteupsPage() {
  const [items, stats] = await Promise.all([listWriteups(), getCategoryStats()]);
  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 md:px-8 md:pt-44">
      <SectionLabel index={2} name="writeups" />
      <SplitHeading as="h1" text="Writeups" className="mb-16 mt-4 font-display text-[18vw] font-black leading-[0.8] tracking-[-0.05em] md:text-[12vw]" />
      <WriteupFilter items={items} categories={stats.map((s) => s.category)} />
    </main>
  );
}
```

- [ ] **Step 2: Flag reveal + TOC**

`src/components/site/flag-reveal.tsx`:
```tsx
"use client";

import { useState } from "react";

export function FlagReveal({ flag }: { flag: string }) {
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-16 border-y border-border py-8">
      <p className="meta mb-3">flag</p>
      {shown ? (
        <div className="flex flex-wrap items-center gap-4">
          <code className="break-all font-mono text-lg text-primary">{flag}</code>
          <button
            type="button"
            className="meta hover:text-foreground"
            onClick={() => navigator.clipboard.writeText(flag).then(() => setCopied(true))}
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setShown(true)} className="group flex items-center gap-4" aria-label="Reveal flag">
          <span className="select-none font-mono text-lg tracking-tight text-foreground/80" aria-hidden>
            {"█".repeat(Math.min(28, Math.max(12, flag.length)))}
          </span>
          <span className="meta group-hover:text-primary">click to reveal</span>
        </button>
      )}
    </div>
  );
}
```

`src/components/site/toc.tsx`:
```tsx
"use client";

import { getLenis } from "@/components/motion/smooth-scroll";

export function Toc({ items }: { items: { id: string; text: string; depth: 2 | 3 }[] }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="On this page" className="sticky top-24 hidden lg:block">
      <p className="meta mb-4">on this page</p>
      <ol className="grid gap-2 text-sm">
        {items.map((t) => (
          <li key={t.id} className={t.depth === 3 ? "pl-4" : ""}>
            <a
              href={`#${t.id}`}
              onClick={(e) => {
                const lenis = getLenis();
                if (!lenis) return;
                e.preventDefault();
                lenis.scrollTo(`#${t.id}`, { offset: -96 });
                history.replaceState(null, "", `#${t.id}`);
              }}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 3: Article page** (`src/app/(site)/writeups/[slug]/page.tsx`)

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SplitHeading } from "@/components/motion/split-heading";
import { FlagReveal } from "@/components/site/flag-reveal";
import { Toc } from "@/components/site/toc";
import { formatDate } from "@/components/site/writeup-index";
import { getProfile } from "@/lib/data/profile";
import { getAdjacentWriteups, getWriteup } from "@/lib/data/writeups";
import { renderWriteupHtml } from "@/lib/html";

export const dynamic = "force-dynamic";
type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const w = await getWriteup((await params).slug);
  if (!w) return { title: "Not found" };
  return {
    title: w.title,
    description: w.summary || `${w.category} writeup from ${w.competition}`,
    alternates: { canonical: w.href },
    openGraph: { type: "article", title: w.title, description: w.summary, images: w.cover ? [w.cover] : undefined, publishedTime: w.date ?? undefined },
  };
}

export default async function WriteupPage({ params }: Params) {
  const w = await getWriteup((await params).slug);
  if (!w) notFound();
  const [{ html, toc }, adjacent, profile] = await Promise.all([renderWriteupHtml(w.content), getAdjacentWriteups(w), getProfile()]);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: w.title,
    datePublished: w.date ?? undefined,
    author: { "@type": "Person", name: profile.displayName, url: profile.websiteUrl ?? undefined },
    keywords: w.tags.join(", "),
  };

  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 md:px-8 md:pt-44">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Link href="/writeups" className="meta hover:text-foreground">
        ← writeups
      </Link>
      <header className="mt-8 border-b border-border pb-10">
        <p className="meta">
          <span className="text-primary">{w.category}</span>
          {w.difficulty && ` · ${w.difficulty}`}
          {w.competition && ` · ${w.competition}`} · {formatDate(w.date)}
        </p>
        <SplitHeading as="h1" text={w.title} className="mt-4 max-w-6xl font-display text-5xl font-black leading-[0.9] tracking-[-0.04em] md:text-8xl" />
        {w.summary && <p className="mt-8 max-w-2xl text-lg text-muted-foreground">{w.summary}</p>}
        {w.tags.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {w.tags.map((t) => (
              <li key={t} className="rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_16rem]">
        <article className="writeup-prose min-w-0" dangerouslySetInnerHTML={{ __html: html }} />
        <aside>
          <Toc items={toc} />
        </aside>
      </div>

      {w.attachments.length > 0 && (
        <section className="mt-16">
          <p className="meta mb-4">attachments</p>
          <ul className="grid gap-2">
            {w.attachments.map((a) => (
              <li key={a.url}>
                <a href={a.url} download className="font-mono text-sm underline decoration-primary underline-offset-4">
                  {a.name.replace(/^[0-9a-f-]{36}-/, "")}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {w.flag && <FlagReveal flag={w.flag} />}

      <nav className="mt-16 grid gap-6 border-t border-border pt-8 md:grid-cols-2" aria-label="More writeups">
        {adjacent.prev ? (
          <Link href={adjacent.prev.href} className="group">
            <span className="meta">← newer {w.category}</span>
            <span className="mt-2 block font-display text-2xl font-semibold group-hover:text-primary">{adjacent.prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {adjacent.next && (
          <Link href={adjacent.next.href} className="group md:text-right">
            <span className="meta">older {w.category} →</span>
            <span className="mt-2 block font-display text-2xl font-semibold group-hover:text-primary">{adjacent.next.title}</span>
          </Link>
        )}
      </nav>
    </main>
  );
}
```

- [ ] **Step 4: Prose styles** (append to `globals.css`)

```css
.writeup-prose { max-width: 72ch; font-size: 1.0625rem; line-height: 1.75; }
.writeup-prose > * + * { margin-top: 1.25em; }
.writeup-prose h2 { font-family: var(--font-display); font-size: 2rem; font-weight: 700; letter-spacing: -0.02em; margin-top: 2.5em; scroll-margin-top: 6rem; }
.writeup-prose h3 { font-family: var(--font-display); font-size: 1.375rem; font-weight: 600; margin-top: 2em; scroll-margin-top: 6rem; }
.writeup-prose a { text-decoration: underline; text-decoration-color: var(--primary); text-underline-offset: 4px; }
.writeup-prose img { width: 100%; height: auto; border: 1px solid var(--border); border-radius: var(--radius); }
.writeup-prose ul { list-style: disc; padding-left: 1.25rem; }
.writeup-prose ol { list-style: decimal; padding-left: 1.25rem; }
.writeup-prose blockquote { border-left: 2px solid var(--primary); padding-left: 1rem; color: var(--muted-foreground); }
.writeup-prose :not(pre) > code { font-family: var(--font-mono); font-size: 0.875em; background: var(--muted); padding: 0.1em 0.35em; border-radius: 4px; }
.writeup-prose pre { font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.6; background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem 1.25rem; overflow-x: auto; }
.writeup-prose table { width: 100%; border-collapse: collapse; font-size: 0.9rem; display: block; overflow-x: auto; }
.writeup-prose th, .writeup-prose td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; }
```

- [ ] **Step 5: Legacy redirect** (`src/app/ctf/[id]/page.tsx`)

```tsx
import { notFound, permanentRedirect } from "next/navigation";
import { getWriteup } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";

export default async function LegacyCtf({ params }: { params: Promise<{ id: string }> }) {
  const w = await getWriteup((await params).id);
  if (!w) notFound();
  permanentRedirect(w.href);
}
```

- [ ] **Step 6: Verify (sandbox disabled)**

```bash
pnpm dev & sleep 6
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/ctf/pwn-truman      # 308 .../writeups/pwn-truman
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/ctf                 # 308 .../writeups
curl -s http://localhost:3000/writeups/pwn-truman | grep -c 'api/public/uploads'                  # >= 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/writeups/does-not-exist            # 404
ID=$(PGPASSWORD=portfolio psql -h 127.0.0.1 -p 5436 -U portfolio -d portfolio -tAc "select id from writeups limit 1")
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/writeups/$ID                        # 200
kill %1
```

Note: `permanentRedirect` returns 308 for GET, as legacy requires.

- [ ] **Step 7: Commit**

```bash
pnpm typecheck && pnpm lint
git add -A && git commit -m "feat(writeups): filterable index, article page, flag reveal, /ctf redirects

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Projects, achievements, about pages, SEO and not-found

**Files:**
- Create: `src/app/(site)/projects/page.tsx`, `src/app/(site)/achievements/page.tsx`, `src/components/site/achievement-list.tsx`, `src/app/(site)/about/page.tsx`, `src/app/not-found.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/layout.tsx` (Person JSON-LD + metadata from profile via `generateMetadata`)

**Interfaces:**
- Consumes: `listProjects`, `listAchievements`, `getProfile`, `listWriteups`, `RecordTimeline`, `Media`, `SplitHeading`, `SectionLabel`, `Reveal`.

- [ ] **Step 1: Projects page**

```tsx
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { listProjects } from "@/lib/data/projects";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage() {
  const projects = await listProjects();
  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 md:px-8 md:pt-44">
      <SectionLabel index={3} name="projects" />
      <SplitHeading as="h1" text="Projects" className="mb-20 mt-4 font-display text-[18vw] font-black leading-[0.8] tracking-[-0.05em] md:text-[12vw]" />
      <Reveal stagger className="grid gap-x-8 gap-y-20 md:grid-cols-2">
        {projects.map((p, i) => (
          <article key={p.id} className={i % 2 ? "md:mt-32" : ""}>
            <Media src={p.imageUrl} alt={p.title} className="aspect-[4/3] w-full" />
            <div className="mt-5 flex items-baseline justify-between gap-6">
              <h2 className="font-display text-3xl font-semibold tracking-tight">{p.title}</h2>
              <span className="meta shrink-0">{p.category}</span>
            </div>
            <p className="mt-3 text-muted-foreground">{p.description}</p>
            {p.tags.length > 0 && <p className="meta mt-4">{p.tags.join(" · ")}</p>}
            {p.projectUrl && (
              <a href={p.projectUrl} target="_blank" rel="noopener noreferrer" className="meta mt-5 inline-block border-b border-primary pb-1 text-foreground">
                visit ↗
              </a>
            )}
          </article>
        ))}
      </Reveal>
    </main>
  );
}
```

- [ ] **Step 2: Achievements page with filter and certificate lightbox**

`src/components/site/achievement-list.tsx`:
```tsx
"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { RecordTimeline } from "@/components/site/record-timeline";
import type { AchievementItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const isCompetition = (a: AchievementItem) => /ctf|competition|rank|top \d|finalist|medal/i.test(`${a.title} ${a.platform ?? ""}`);

export function AchievementList({ items }: { items: AchievementItem[] }) {
  const [kind, setKind] = useState<"all" | "competitions" | "learning">("all");
  const [open, setOpen] = useState<AchievementItem | null>(null);
  const filtered = useMemo(() => items.filter((a) => kind === "all" || (kind === "competitions") === isCompetition(a)), [items, kind]);
  const withImages = filtered.filter((a) => a.imageUrl);
  return (
    <>
      <div className="mb-12 flex gap-2" role="group" aria-label="Filter record">
        {(["all", "competitions", "learning"] as const).map((k) => (
          <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={cn("rounded-full border px-4 py-1.5 font-mono text-xs uppercase tracking-wider", kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground")}>
            {k}
          </button>
        ))}
      </div>
      <RecordTimeline items={filtered} />
      {withImages.length > 0 && (
        <section className="mt-24">
          <p className="meta mb-6">certificates</p>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {withImages.map((a) => (
              <li key={a.id}>
                <button type="button" onClick={() => setOpen(a)} className="block w-full overflow-hidden border border-border" aria-label={`View certificate: ${a.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.imageUrl!} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-105" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-4xl">
          <DialogTitle className="font-display">{open?.title}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {open?.imageUrl && <img src={open.imageUrl} alt={open.title} className="max-h-[75vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

`src/app/(site)/achievements/page.tsx`:
```tsx
import type { Metadata } from "next";
import { SplitHeading } from "@/components/motion/split-heading";
import { AchievementList } from "@/components/site/achievement-list";
import { SectionLabel } from "@/components/site/section-label";
import { listAchievements } from "@/lib/data/achievements";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Record" };

export default async function AchievementsPage() {
  const items = await listAchievements();
  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 md:px-8 md:pt-44">
      <SectionLabel index={4} name="record" />
      <SplitHeading as="h1" text="Record" className="mb-16 mt-4 font-display text-[18vw] font-black leading-[0.8] tracking-[-0.05em] md:text-[12vw]" />
      <AchievementList items={items} />
    </main>
  );
}
```

- [ ] **Step 3: About page**

```tsx
import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Media } from "@/components/site/media";
import { SectionLabel } from "@/components/site/section-label";
import { getProfile } from "@/lib/data/profile";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "About" };

export default async function AboutPage() {
  const p = await getProfile();
  return (
    <main className="mx-auto max-w-[1600px] px-4 pb-24 pt-32 md:px-8 md:pt-44">
      <SectionLabel index={1} name="about" />
      <SplitHeading as="h1" text={p.alias} className="mb-16 mt-4 font-display text-[18vw] font-black leading-[0.8] tracking-[-0.05em] md:text-[12vw]" />
      <div className="grid gap-12 md:grid-cols-12">
        <Media src={p.profileImageUrl} alt={p.displayName} className="aspect-[3/4] w-full grayscale md:col-span-4" eager />
        <div className="md:col-span-7 md:col-start-6">
          <p className="font-display text-2xl leading-snug tracking-tight md:text-4xl">{p.aboutText}</p>
        </div>
      </div>

      <section className="mt-32 grid gap-10 md:grid-cols-12">
        <h2 className="meta md:col-span-3">skills</h2>
        <Reveal as="ul" stagger y={12} className="md:col-span-9">
          {p.skills.map((s, i) => (
            <li key={s.name} className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-border py-4">
              <span className={i === 0 ? "font-display text-3xl font-semibold text-primary" : "text-lg"}>{s.name}</span>
              <span className="flex items-center gap-3">
                <span className="relative block h-px w-24 bg-border md:w-48">
                  <span className="absolute inset-y-0 left-0 bg-foreground" style={{ width: `${s.level}%` }} />
                </span>
                <span className="w-8 text-right font-mono text-xs text-muted-foreground">{s.level}</span>
              </span>
            </li>
          ))}
        </Reveal>
      </section>

      {p.journey.length > 0 && (
        <section className="mt-32 grid gap-10 md:grid-cols-12">
          <h2 className="meta md:col-span-3">journey</h2>
          <Reveal as="ol" stagger className="grid gap-12 md:col-span-9">
            {p.journey.map((j) => (
              <li key={`${j.role}-${j.period}`} className="grid gap-2 md:grid-cols-[10rem_1fr]">
                <span className="meta">{j.period}</span>
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight">{j.role}</h3>
                  <p className="meta mt-1">{j.company}</p>
                  <p className="mt-3 max-w-2xl text-muted-foreground">{j.desc}</p>
                </div>
              </li>
            ))}
          </Reveal>
        </section>
      )}

      {p.education.length > 0 && (
        <section className="mt-32 grid gap-10 md:grid-cols-12">
          <h2 className="meta md:col-span-3">education</h2>
          <ul className="md:col-span-9">
            {p.education.map((e) => (
              <li key={e.school} className="grid grid-cols-[1fr_auto] gap-6 border-b border-border py-4">
                <span>
                  <span className="text-lg">{e.school}</span> <span className="meta ml-2">{e.level}</span>
                </span>
                <span className="meta">{e.period}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
```

- [ ] **Step 4: not-found, sitemap, robots**

`src/app/not-found.tsx`:
```tsx
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-svh max-w-[1600px] flex-col justify-center px-4 md:px-8">
      <p className="meta">0x194 / not found</p>
      <h1 className="mt-4 font-display text-[22vw] font-black leading-[0.8] tracking-[-0.05em] md:text-[14vw]">404</h1>
      <p className="mt-6 max-w-md text-muted-foreground">This address doesn&apos;t map to anything. Segfault avoided.</p>
      <Link href="/" className="meta mt-8 w-fit border-b border-primary pb-1 text-foreground">
        back home →
      </Link>
    </main>
  );
}
```

`src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from "next";
import { listWriteups } from "@/lib/data/writeups";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://claritys.web.id";
  const writeups = await listWriteups().catch(() => []);
  return [
    ...["", "/writeups", "/projects", "/achievements", "/about"].map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const })),
    ...writeups.map((w) => ({ url: `${base}${w.href}`, lastModified: w.date ?? undefined })),
  ];
}
```

`src/app/robots.ts`:
```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://claritys.web.id";
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/admin", "/api/auth"] }], sitemap: `${base}/sitemap.xml` };
}
```

- [ ] **Step 5: Person JSON-LD + keywords.** In `src/app/(site)/layout.tsx`, add after `<Nav/>`:

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: profile.displayName,
      alternateName: profile.alias,
      jobTitle: profile.seo.jobTitle,
      url: profile.websiteUrl,
      sameAs: profile.seo.sameAs,
      knowsAbout: profile.skills.map((s) => s.name),
    }).replace(/</g, "\\u003c"),
  }}
/>
```
and export from the same layout (add `import type { Metadata } from "next";` at the top):
```tsx
export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile();
  return { keywords: p.seo.keywords, description: p.seo.description ?? "Pwn-focused CTF player and builder from Malang, Indonesia.", openGraph: { siteName: p.alias, locale: p.seo.locale } };
}
```

- [ ] **Step 6: Verify and commit (sandbox disabled for dev server)**

Screenshot `/projects`, `/achievements`, `/about`, and `/nope` at 1440 and 390 via Playwright MCP. Check there is no horizontal overflow and the certificate dialog opens and closes with Escape.

```bash
pnpm typecheck && pnpm lint && pnpm build
git add -A && git commit -m "feat(site): projects, record, about pages, SEO, 404

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

### Task 13: Admin shell: login, panel layout, dashboard, messages, access logs

**Files:**
- Create: `src/app/admin/login/page.tsx`, `src/components/admin/login-form.tsx`, `src/app/admin/(panel)/layout.tsx`, `src/components/admin/sidebar.tsx`, `src/app/admin/(panel)/page.tsx`, `src/app/admin/(panel)/messages/page.tsx`, `src/app/admin/(panel)/logs/page.tsx`, `src/lib/admin/actions/messages.ts`, `src/components/admin/delete-button.tsx`, `src/lib/admin/form.ts`
- Test: `tests/unit/admin-form.test.ts`

**Interfaces:**
- Consumes: `requireAdmin` (Task 5), `prisma`, shadcn `Button`, `Input`, `Label`, `Table`, `AlertDialog`, `Badge`.
- Produces:
  - `@/lib/admin/form`: `type ActionState = { ok: boolean; message?: string; fields?: Record<string, string[] | undefined> }`, `formToObject(fd: FormData): Record<string, string>` (drops keys starting with `$ACTION`), `pageParam(v: string | string[] | undefined): number` (≥1).
  - `@/lib/admin/actions/messages`: `deleteMessage(id: string): Promise<void>`, `deleteMessages(fd: FormData): Promise<void>` (reads all `ids` values).
  - `<DeleteButton action={() => Promise<void>} label? confirm? />`: an AlertDialog-confirmed destructive button, reused by Tasks 14–15.
  - Admin URL map: `/admin`, `/admin/writeups`, `/admin/projects`, `/admin/achievements`, `/admin/profile`, `/admin/messages`, `/admin/logs`, `/admin/uploads`.

- [ ] **Step 1: Failing test** (`tests/unit/admin-form.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { formToObject, pageParam } from "@/lib/admin/form";

describe("admin form helpers", () => {
  it("formToObject keeps last string value and drops action keys and files", () => {
    const fd = new FormData();
    fd.append("title", "A");
    fd.append("$ACTION_ID_abc", "");
    fd.append("file", new File(["x"], "x.txt"));
    expect(formToObject(fd)).toEqual({ title: "A" });
  });
  it("pageParam sanitizes", () => {
    expect(pageParam("3")).toBe(3);
    expect(pageParam(["2", "9"])).toBe(2);
    expect(pageParam("-1")).toBe(1);
    expect(pageParam("abc")).toBe(1);
    expect(pageParam(undefined)).toBe(1);
  });
});
```

Run: FAIL.

- [ ] **Step 2: `src/lib/admin/form.ts`**

```ts
export type ActionState = { ok: boolean; message?: string; fields?: Record<string, string[] | undefined> };

export function formToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of fd.entries()) {
    if (k.startsWith("$ACTION") || typeof v !== "string") continue;
    out[k] = v;
  }
  return out;
}

export function pageParam(v: string | string[] | undefined): number {
  const n = Number.parseInt(Array.isArray(v) ? v[0] : (v ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}
```

Run: PASS.

- [ ] **Step 3: Login**

`src/components/admin/login-form.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    setPending(false);
    if (res?.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    setError((await res?.json().catch(() => null))?.error ?? "Network error.");
  }

  return (
    <form onSubmit={onSubmit} className="grid w-full max-w-sm gap-5">
      <div className="grid gap-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" name="username" autoComplete="username" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
```

`src/app/admin/login/page.tsx`:
```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="grid min-h-svh place-items-center px-4">
      <div className="grid w-full max-w-sm gap-8">
        <p className="meta">
          <span className="text-primary">0x00</span> / admin
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Panel layout + sidebar**

`src/components/admin/sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  ["/admin", "Dashboard"],
  ["/admin/writeups", "Writeups"],
  ["/admin/projects", "Projects"],
  ["/admin/achievements", "Achievements"],
  ["/admin/profile", "Profile"],
  ["/admin/messages", "Messages"],
  ["/admin/uploads", "Uploads"],
  ["/admin/logs", "Access logs"],
] as const;

export function Sidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <aside className="flex flex-col gap-1 border-b border-border p-4 md:sticky md:top-0 md:h-svh md:w-56 md:border-b-0 md:border-r">
      <Link href="/" className="mb-6 font-display text-lg font-semibold">
        Claritys <span className="meta ml-1">admin</span>
      </Link>
      <nav className="flex gap-1 overflow-x-auto md:flex-col">
        {ITEMS.map(([href, label]) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={cn("whitespace-nowrap rounded-md px-3 py-2 text-sm", active ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto hidden pt-6 md:block">
        <p className="meta mb-2">{username}</p>
        <button
          type="button"
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            router.replace("/admin/login");
          }}
        >
          Log out
        </button>
      </div>
    </aside>
  );
}
```

`src/app/admin/(panel)/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Sidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/admin/guard";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { username } = await requireAdmin();
  return (
    <div className="min-h-svh md:flex">
      <Sidebar username={username} />
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 5: DeleteButton** (`src/components/admin/delete-button.tsx`)

```tsx
"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteButton({ action, label = "Delete", confirm = "This cannot be undone." }: { action: () => Promise<void>; label?: string; confirm?: string }) {
  const [pending, start] = useTransition();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="text-destructive" disabled={pending}>
          {pending ? "Deleting…" : label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>{confirm}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              start(async () => {
                try {
                  await action();
                  toast.success("Deleted");
                } catch {
                  toast.error("Delete failed");
                }
              })
            }
          >
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

- [ ] **Step 6: Message actions** (`src/lib/admin/actions/messages.ts`)

```ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export async function deleteMessage(id: string) {
  await requireAdmin();
  await prisma.secureMessage.delete({ where: { id } });
  revalidatePath("/admin/messages");
}

export async function deleteMessages(fd: FormData) {
  await requireAdmin();
  const ids = fd.getAll("ids").filter((v): v is string => typeof v === "string");
  if (ids.length) await prisma.secureMessage.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/messages");
}
```

- [ ] **Step 7: Dashboard, messages and logs pages**

`src/app/admin/(panel)/page.tsx`:
```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function Dashboard() {
  await requireAdmin();
  const [writeups, projects, achievements, messages, latest, failed] = await Promise.all([
    prisma.writeup.count(),
    prisma.project.count(),
    prisma.achievement.count(),
    prisma.secureMessage.count(),
    prisma.secureMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.accessLog.count({ where: { accessSuccessful: false, accessedAt: { gte: new Date(Date.now() - 7 * 864e5) } } }),
  ]);
  const cards = [
    ["Writeups", writeups, "/admin/writeups"],
    ["Projects", projects, "/admin/projects"],
    ["Achievements", achievements, "/admin/achievements"],
    ["Messages", messages, "/admin/messages"],
    ["Failed logins (7d)", failed, "/admin/logs"],
  ] as const;
  return (
    <div className="grid gap-10">
      <h1 className="font-display text-4xl font-bold tracking-tight">Dashboard</h1>
      <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-5">
        {cards.map(([label, n, href]) => (
          <Link key={label} href={href} className="bg-background p-5 hover:bg-secondary">
            <p className="meta">{label}</p>
            <p className="mt-2 font-display text-4xl font-black tabular-nums">{n}</p>
          </Link>
        ))}
      </div>
      <section>
        <h2 className="meta mb-3">latest messages</h2>
        <ul className="divide-y divide-border border-y border-border">
          {latest.map((m) => (
            <li key={m.id} className="py-3">
              <p className="font-medium">{m.title ?? "(no subject)"}</p>
              <p className="line-clamp-1 text-sm text-muted-foreground">{m.content}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
```

`src/app/admin/(panel)/messages/page.tsx`:
```tsx
import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteMessage, deleteMessages } from "@/lib/admin/actions/messages";
import { pageParam } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

const PAGE = 50;

export default async function MessagesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageParam(sp.page);
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const where = q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { content: { contains: q, mode: "insensitive" as const } }] } : {};
  const [total, rows] = await Promise.all([
    prisma.secureMessage.count({ where }),
    prisma.secureMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-4xl font-bold tracking-tight">Messages <span className="meta">{total}</span></h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="search" className="h-9 rounded-md border border-input bg-transparent px-3 text-sm" />
          <Button size="sm" variant="secondary">Search</Button>
        </form>
      </div>
      <form action={deleteMessages} className="grid gap-3">
        <div>
          <Button size="sm" variant="destructive" type="submit">Delete selected</Button>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((m) => (
            <li key={m.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 py-4">
              <input type="checkbox" name="ids" value={m.id} aria-label={`Select ${m.title ?? "message"}`} className="mt-1.5" />
              <details>
                <summary className="cursor-pointer">
                  <span className="font-medium">{m.title ?? "(no subject)"}</span>
                  <span className="meta ml-3">{m.createdAt.toISOString().slice(0, 16).replace("T", " ")}</span>
                </summary>
                <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm text-muted-foreground">{m.content}</pre>
              </details>
              <DeleteButton action={deleteMessage.bind(null, m.id)} />
            </li>
          ))}
        </ul>
      </form>
      <nav className="flex items-center gap-4 text-sm">
        {page > 1 && <Link href={`?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>← prev</Link>}
        <span className="meta">page {page} / {pages}</span>
        {page < pages && <Link href={`?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>next →</Link>}
      </nav>
    </div>
  );
}
```

Note: `DeleteButton`'s trigger is explicitly `type="button"`. shadcn `Button` sets no default type, so without it the per-row trigger inside the bulk-delete `<form>` would submit the form.

`src/app/admin/(panel)/logs/page.tsx`:
```tsx
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export default async function LogsPage() {
  await requireAdmin();
  const logs = await prisma.accessLog.findMany({ orderBy: { accessedAt: "desc" }, take: 300 });
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Access logs</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="meta text-left">
            <tr><th className="py-2">When</th><th>User</th><th>IP</th><th>Result</th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="py-2 font-mono text-xs">{l.accessedAt.toISOString().replace("T", " ").slice(0, 19)}</td>
                <td>{l.username}</td>
                <td className="font-mono text-xs">{l.ip}</td>
                <td><Badge variant={l.accessSuccessful ? "secondary" : "destructive"}>{l.accessSuccessful ? "ok" : "failed"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Verify (sandbox disabled)**
  - `/admin` redirects to `/admin/login` when logged out.
  - Logging in with `.env.local` credentials lands on the dashboard showing 39/4/28/386.
  - `/admin/messages?page=8` shows the last page.
  - A wrong password logs a failed row in `/admin/logs`.
  - The 6th wrong attempt within 10 min returns 429.

```bash
pnpm test && pnpm typecheck && pnpm lint
git add -A && git commit -m "feat(admin): login, panel shell, dashboard, messages, access logs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Admin CRUD for projects and achievements, and the uploads manager

**Files:**
- Create: `src/lib/admin/schemas.ts`, `src/lib/admin/actions/projects.ts`, `src/lib/admin/actions/achievements.ts`, `src/components/admin/image-field.tsx`, `src/components/admin/field.tsx`, `src/components/admin/project-form.tsx`, `src/components/admin/achievement-form.tsx`, `src/app/admin/(panel)/projects/page.tsx`, `src/app/admin/(panel)/projects/new/page.tsx`, `src/app/admin/(panel)/projects/[id]/page.tsx`, `src/app/admin/(panel)/achievements/page.tsx`, `src/app/admin/(panel)/achievements/new/page.tsx`, `src/app/admin/(panel)/achievements/[id]/page.tsx`, `src/app/api/admin/upload/route.ts`, `src/app/api/admin/upload/[name]/route.ts`, `src/app/admin/(panel)/uploads/page.tsx`, `src/components/admin/upload-manager.tsx`
- Test: `tests/unit/admin-schemas.test.ts`

**Interfaces:**
- Consumes: `ActionState`, `formToObject` (Task 13), `writeUpload`, `deleteUpload`, `listUploads`, `UploadError` (Task 4), `requireAdmin`, `DeleteButton`.
- Produces (`@/lib/admin/schemas`):
  - `mediaUrl` (zod: empty → null; must start with `/`, `http://`, `https://` or `data:image/`; max 8_000_000 chars)
  - `linkUrl` (empty → null; `/…` or `http(s)://…`)
  - `tagsField` (comma string → `string[]`, each ≤40, max 30)
  - `dateField` (`YYYY-MM-DD` or empty → `Date | null`, UTC midnight)
  - `ProjectSchema` → `{ id?: string; title: string; description: string | null; imageUrl: string | null; projectUrl: string | null; category: string | null; tags: string[] }`
  - `AchievementSchema` → `{ id?: string; title: string; issuer; platform; description; imageUrl; date: Date | null; proofScore: number | null }`
- Produces (actions): `saveProject(prev: ActionState, fd: FormData): Promise<ActionState>`, `deleteProject(id: string)`, `saveAchievement(prev, fd)`, `deleteAchievement(id)`. On success they `redirect()` to the list page.
- Produces: `POST /api/admin/upload` (multipart `file`) → `{ name, url, contentType }`, with 413/415 on `UploadError`. `DELETE /api/admin/upload/[name]` → `{ ok: true }` or a 400/404 code. `<ImageField name defaultValue label />`. `<Field label name error children />`.

- [ ] **Step 1: Failing schema tests** (`tests/unit/admin-schemas.test.ts`)

```ts
import { describe, expect, it } from "vitest";
import { AchievementSchema, ProjectSchema } from "@/lib/admin/schemas";

describe("ProjectSchema", () => {
  it("normalises empties to null and splits tags", () => {
    const r = ProjectSchema.parse({ title: " DevSecOps ", description: "", imageUrl: "", projectUrl: "https://x.dev", category: "", tags: "Docker, Go, ,Linux" });
    expect(r).toEqual({ title: "DevSecOps", description: null, imageUrl: null, projectUrl: "https://x.dev", category: null, tags: ["Docker", "Go", "Linux"] });
  });
  it("accepts legacy media forms and rejects javascript:", () => {
    expect(ProjectSchema.parse({ title: "a", imageUrl: "data:image/jpeg;base64,AAAA" }).imageUrl).toMatch(/^data:image/);
    expect(ProjectSchema.parse({ title: "a", imageUrl: "/api/public/uploads/x.png" }).imageUrl).toBe("/api/public/uploads/x.png");
    expect(ProjectSchema.safeParse({ title: "a", projectUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(ProjectSchema.safeParse({ title: "" }).success).toBe(false);
  });
});

describe("AchievementSchema", () => {
  it("parses date and proof score", () => {
    const r = AchievementSchema.parse({ title: "Top 20", date: "2026-05-01", proofScore: "88" });
    expect(r.date?.toISOString()).toBe("2026-05-01T00:00:00.000Z");
    expect(r.proofScore).toBe(88);
  });
  it("empty proof score and date become null; bad date fails", () => {
    const r = AchievementSchema.parse({ title: "x", date: "", proofScore: "" });
    expect(r.date).toBeNull();
    expect(r.proofScore).toBeNull();
    expect(AchievementSchema.safeParse({ title: "x", date: "2026-13-45" }).success).toBe(false);
  });
});
```

Run: FAIL.

- [ ] **Step 2: `src/lib/admin/schemas.ts`**

```ts
import { z } from "zod";

const blankToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().default(null));

export const mediaUrl = z.preprocess(
  blankToNull,
  z.string().trim().max(8_000_000).refine((v) => /^(\/(?!\/)|https?:\/\/|data:image\/)/i.test(v), "Must be a /path, http(s) URL or data:image").nullable().default(null),
);

export const linkUrl = z.preprocess(
  blankToNull,
  z.string().trim().max(2000).refine((v) => /^(\/(?!\/)|https?:\/\/)/i.test(v), "Must be a /path or http(s) URL").nullable().default(null),
);

export const tagsField = z
  .preprocess((v) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : (v ?? [])), z.array(z.string().max(40)).max(30))
  .default([]);

export const dateField = z.preprocess(
  blankToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .transform((s, ctx) => {
      const d = new Date(`${s}T00:00:00.000Z`);
      if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
        ctx.addIssue({ code: "custom", message: "Invalid date" });
        return z.NEVER;
      }
      return d;
    })
    .nullable()
    .default(null),
);

const id = z.preprocess(blankToNull, z.string().uuid().optional().nullable()).transform((v) => v ?? undefined);

export const ProjectSchema = z.object({
  id,
  title: z.string().trim().min(1, "Title is required").max(200),
  description: optText(5000),
  imageUrl: mediaUrl,
  projectUrl: linkUrl,
  category: optText(80),
  tags: tagsField,
});

export const AchievementSchema = z.object({
  id,
  title: z.string().trim().min(1, "Title is required").max(300),
  issuer: optText(300),
  platform: optText(120),
  description: optText(5000),
  imageUrl: mediaUrl,
  date: dateField,
  proofScore: z.preprocess(blankToNull, z.coerce.number().int().min(0).max(1000).nullable().default(null)),
});
```

The tests expect the parsed project without an `id` key. If zod emits `id: undefined`, change the expectation to use `toMatchObject` or `toEqual` with `expect.objectContaining`. `toEqual` already ignores `undefined` properties, so this should pass as written.

Run: PASS.

- [ ] **Step 3: Upload API routes**

`src/app/api/admin/upload/route.ts`:
```ts
import { requireAdminApi } from "@/lib/admin/guard";
import { UploadError, writeUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });
  try {
    return Response.json(await writeUpload(file), { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return Response.json({ error: e.message }, { status: e.status });
    return Response.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

`src/app/api/admin/upload/[name]/route.ts`:
```ts
import { requireAdminApi } from "@/lib/admin/guard";
import { deleteUpload } from "@/lib/uploads";

export async function DELETE(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const status = await deleteUpload((await params).name);
  return Response.json(status === 200 ? { ok: true } : { error: status === 400 ? "Invalid name" : "Not found" }, { status });
}
```

Add to `src/lib/admin/guard.ts` (defence in depth; the proxy already gates `/api/admin`):
```ts
export async function requireAdminApi() {
  return getSession();
}
```

- [ ] **Step 4: Shared form components**

`src/components/admin/field.tsx`:
```tsx
import { Label } from "@/components/ui/label";

export function Field({ label, name, error, hint, children }: { label: string; name: string; error?: string[]; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error?.[0] && <p className="text-sm text-destructive">{error[0]}</p>}
    </div>
  );
}
```

`src/components/admin/image-field.tsx`:
```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json.url as string;
}

export function ImageField({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-3">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="max-h-48 w-fit rounded border border-border object-contain" />
      )}
      <div className="flex gap-2">
        <Input id={name} name={name} value={value.startsWith("data:") ? "" : value} placeholder={value.startsWith("data:") ? "(embedded image — upload to replace)" : "/api/public/uploads/… or https://…"} onChange={(e) => setValue(e.target.value)} />
        {value.startsWith("data:") && <input type="hidden" name={name} value={value} />}
        <Button type="button" variant="secondary" disabled={busy} asChild>
          <label className="cursor-pointer">
            {busy ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true);
                try {
                  setValue(await uploadFile(f));
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
        </Button>
      </div>
    </div>
  );
}
```

Note on `data:` values: the text input is shown empty and the original travels in a hidden input, so a legacy embedded image survives saves. If the visible input is empty *and* a hidden input exists, `formToObject` keeps the **last** value. The hidden input comes after the visible one, so it wins. When the user types a new URL, `value` no longer starts with `data:` and the hidden input disappears.

- [ ] **Step 5: Project actions** (`src/lib/admin/actions/projects.ts`)

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { ProjectSchema } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";

export async function saveProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = ProjectSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { id, tags, ...rest } = parsed.data;
  const data = { ...rest, tagsJson: tags };
  if (id) await prisma.project.update({ where: { id }, data });
  else await prisma.project.create({ data });
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
}
```

`src/lib/admin/actions/achievements.ts`:
```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { AchievementSchema } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";

export async function saveAchievement(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = AchievementSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { id, ...data } = parsed.data;
  if (id) await prisma.achievement.update({ where: { id }, data });
  else await prisma.achievement.create({ data });
  revalidatePath("/admin/achievements");
  redirect("/admin/achievements");
}

export async function deleteAchievement(id: string) {
  await requireAdmin();
  await prisma.achievement.delete({ where: { id } });
  revalidatePath("/admin/achievements");
}
```

- [ ] **Step 6: Forms**

`src/components/admin/project-form.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import { Field } from "@/components/admin/field";
import { ImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveProject } from "@/lib/admin/actions/projects";
import type { ActionState } from "@/lib/admin/form";

type Initial = { id?: string; title?: string | null; description?: string | null; imageUrl?: string | null; projectUrl?: string | null; category?: string | null; tags?: string[] };

export function ProjectForm({ initial = {} }: { initial?: Initial }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProject, { ok: true });
  const f = state.fields ?? {};
  return (
    <form action={action} className="grid max-w-2xl gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Title" name="title" error={f.title}>
        <Input id="title" name="title" defaultValue={initial.title ?? ""} required />
      </Field>
      <Field label="Category" name="category" error={f.category}>
        <Input id="category" name="category" defaultValue={initial.category ?? ""} />
      </Field>
      <Field label="Description" name="description" error={f.description}>
        <Textarea id="description" name="description" rows={5} defaultValue={initial.description ?? ""} />
      </Field>
      <Field label="Image" name="imageUrl" error={f.imageUrl}>
        <ImageField name="imageUrl" defaultValue={initial.imageUrl} />
      </Field>
      <Field label="Project URL" name="projectUrl" error={f.projectUrl}>
        <Input id="projectUrl" name="projectUrl" defaultValue={initial.projectUrl ?? ""} />
      </Field>
      <Field label="Tags" name="tags" hint="Comma separated" error={f.tags}>
        <Input id="tags" name="tags" defaultValue={(initial.tags ?? []).join(", ")} />
      </Field>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save project"}
      </Button>
    </form>
  );
}
```

`src/components/admin/achievement-form.tsx`:
```tsx
"use client";

import { useActionState } from "react";
import { Field } from "@/components/admin/field";
import { ImageField } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveAchievement } from "@/lib/admin/actions/achievements";
import type { ActionState } from "@/lib/admin/form";

type Initial = { id?: string; title?: string | null; issuer?: string | null; platform?: string | null; description?: string | null; imageUrl?: string | null; date?: string | null; proofScore?: number | null };

export function AchievementForm({ initial = {} }: { initial?: Initial }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveAchievement, { ok: true });
  const f = state.fields ?? {};
  return (
    <form action={action} className="grid max-w-2xl gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <Field label="Title" name="title" error={f.title}>
        <Input id="title" name="title" defaultValue={initial.title ?? ""} required />
      </Field>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Issuer" name="issuer" error={f.issuer}>
          <Input id="issuer" name="issuer" defaultValue={initial.issuer ?? ""} />
        </Field>
        <Field label="Platform" name="platform" error={f.platform}>
          <Input id="platform" name="platform" defaultValue={initial.platform ?? ""} />
        </Field>
        <Field label="Date" name="date" error={f.date}>
          <Input id="date" name="date" type="date" defaultValue={initial.date ?? ""} />
        </Field>
        <Field label="Proof score" name="proofScore" hint="Higher = shown larger. Empty = auto." error={f.proofScore}>
          <Input id="proofScore" name="proofScore" type="number" min={0} max={1000} defaultValue={initial.proofScore ?? ""} />
        </Field>
      </div>
      <Field label="Description" name="description" error={f.description}>
        <Textarea id="description" name="description" rows={4} defaultValue={initial.description ?? ""} />
      </Field>
      <Field label="Certificate image" name="imageUrl" error={f.imageUrl}>
        <ImageField name="imageUrl" defaultValue={initial.imageUrl} />
      </Field>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Save achievement"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 7: List / new / edit pages**

`src/app/admin/(panel)/projects/page.tsx`:
```tsx
import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/admin/actions/projects";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function ProjectsAdmin() {
  await requireAdmin();
  const rows = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold tracking-tight">Projects</h1>
        <Button asChild><Link href="/admin/projects/new">New project</Link></Button>
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {rows.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 py-3">
            <Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-primary">{p.title ?? "Untitled"}</Link>
            <div className="flex items-center gap-3">
              <span className="meta">{p.category}</span>
              <DeleteButton action={deleteProject.bind(null, p.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/app/admin/(panel)/projects/new/page.tsx`:
```tsx
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdmin } from "@/lib/admin/guard";

export default async function NewProject() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">New project</h1>
      <ProjectForm />
    </div>
  );
}
```

`src/app/admin/(panel)/projects/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { parseStringArray } from "@/lib/json";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const p = await prisma.project.findUnique({ where: { id: (await params).id } }).catch(() => null);
  if (!p) notFound();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Edit project</h1>
      <ProjectForm initial={{ ...p, tags: parseStringArray(p.tagsJson) }} />
    </div>
  );
}
```

`src/app/admin/(panel)/achievements/page.tsx`:
```tsx
import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteAchievement } from "@/lib/admin/actions/achievements";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function AchievementsAdmin() {
  await requireAdmin();
  const rows = await prisma.achievement.findMany({ orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold tracking-tight">Achievements <span className="meta">{rows.length}</span></h1>
        <Button asChild><Link href="/admin/achievements/new">New achievement</Link></Button>
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {rows.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 py-3">
            <Link href={`/admin/achievements/${a.id}`} className="font-medium hover:text-primary">{a.title ?? "Untitled"}</Link>
            <div className="flex items-center gap-3">
              <span className="meta">{a.date?.toISOString().slice(0, 10) ?? "undated"}</span>
              <DeleteButton action={deleteAchievement.bind(null, a.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/app/admin/(panel)/achievements/new/page.tsx`:
```tsx
import { AchievementForm } from "@/components/admin/achievement-form";
import { requireAdmin } from "@/lib/admin/guard";

export default async function NewAchievement() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">New achievement</h1>
      <AchievementForm />
    </div>
  );
}
```

`src/app/admin/(panel)/achievements/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { AchievementForm } from "@/components/admin/achievement-form";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function EditAchievement({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const a = await prisma.achievement.findUnique({ where: { id: (await params).id } }).catch(() => null);
  if (!a) notFound();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Edit achievement</h1>
      <AchievementForm initial={{ ...a, date: a.date?.toISOString().slice(0, 10) ?? null }} />
    </div>
  );
}
```

- [ ] **Step 8: Uploads manager**

`src/components/admin/upload-manager.tsx`:
```tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/components/admin/image-field";
import { Button } from "@/components/ui/button";

type Item = { name: string; size: number; modified: string; url: string };

export function UploadManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <div className="grid gap-6">
      <Button asChild variant="secondary" className="w-fit" disabled={busy}>
        <label className="cursor-pointer">
          {busy ? "Uploading…" : "Upload files"}
          <input
            type="file"
            multiple
            className="sr-only"
            onChange={async (e) => {
              const files = Array.from(e.target.files ?? []);
              setBusy(true);
              for (const f of files) await uploadFile(f).catch((err) => toast.error(`${f.name}: ${err.message}`));
              setBusy(false);
              router.refresh();
            }}
          />
        </label>
      </Button>
      <ul className="divide-y divide-border border-y border-border">
        {items.map((i) => (
          <li key={i.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-2 text-sm">
            <a href={i.url} target="_blank" rel="noreferrer" className="truncate font-mono text-xs hover:text-primary">{i.name}</a>
            <span className="meta">{(i.size / 1024).toFixed(0)} KB</span>
            <Button size="sm" variant="ghost" type="button" onClick={() => navigator.clipboard.writeText(i.url).then(() => toast.success("URL copied"))}>Copy URL</Button>
            <Button
              size="sm"
              variant="ghost"
              type="button"
              className="text-destructive"
              onClick={async () => {
                if (!confirm(`Delete ${i.name}? Content referencing it will break.`)) return;
                const res = await fetch(`/api/admin/upload/${encodeURIComponent(i.name)}`, { method: "DELETE" });
                if (res.ok) router.refresh();
                else toast.error("Delete failed");
              }}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/app/admin/(panel)/uploads/page.tsx`:
```tsx
import { UploadManager } from "@/components/admin/upload-manager";
import { requireAdmin } from "@/lib/admin/guard";
import { listUploads } from "@/lib/uploads";

export default async function UploadsPage() {
  await requireAdmin();
  const items = await listUploads();
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">Uploads <span className="meta">{items.length}</span></h1>
      <UploadManager items={items} />
    </div>
  );
}
```

- [ ] **Step 9: Verify and commit (sandbox disabled).** Logged in:
  1. Create a project with an uploaded image. It shows on `/projects` immediately.
  2. Edit the "Challenge CTF Forensic (QuaSSo TV)" project (the `data:` image) and change only its title. The image must survive.
  3. Delete the test project.
  4. Run `curl -X POST /api/admin/upload` without the cookie. Expect 401.

```bash
pnpm test && pnpm typecheck && pnpm lint
git add -A && git commit -m "feat(admin): projects and achievements CRUD, uploads manager

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Admin writeups: Tiptap editor, slugs, attachments, PDF/Notion import

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/admin/actions/writeups.ts`, `src/components/admin/rich-editor.tsx`, `src/components/admin/attachments-field.tsx`, `src/components/admin/pdf-import.tsx`, `src/components/admin/writeup-form.tsx`, `src/app/admin/(panel)/writeups/page.tsx`, `src/app/admin/(panel)/writeups/new/page.tsx`, `src/app/admin/(panel)/writeups/[id]/page.tsx`, `src/app/api/admin/writeups/import-pdf/route.ts`
- Modify: `src/lib/admin/schemas.ts` (add `WriteupSchema`), `src/lib/uploads.ts` (add `writeUploadBuffer`)
- Test: `tests/unit/slug.test.ts`, extend `tests/unit/admin-schemas.test.ts`, extend `tests/unit/uploads.test.ts`

**Interfaces:**
- Produces:
  - `@/lib/slug`: `slugify(s: string): string` (lowercase ascii, `-` separated, max 80), `defaultWriteupSlug(category: string | null, title: string): string` (`slugify(\`${category ?? ""} ${title}\`)`, matching the legacy `pwn-truman` pattern).
  - `WriteupSchema` → `{ id?; title: string; slug: string | null; competition; category; difficulty; date: Date | null; summary; content: string; flag; tags: string[]; attachments: Attachment[] }` (`attachments` arrives as a JSON string).
  - `writeUploadBuffer(originalName: string, buf: Buffer): Promise<{ name: string; url: string; contentType: string }>` (no type allow-list, because it's used only for import assets; still sanitizes the name).
  - Actions: `saveWriteup(prev, fd): Promise<ActionState>` (auto-slug when empty, slug-conflict field error), `deleteWriteup(id)`.
  - `<RichEditor name defaultValue />` (Tiptap 3 → hidden input carrying HTML), `<AttachmentsField name defaultValue />`, `<PdfImport onImported(doc: {title, summary, content}) />`.
  - `POST /api/admin/writeups/import-pdf` (multipart `file`) → `{ title, summary, content, pageCount?, assetCount?, sourceType }` (legacy contract).

- [ ] **Step 1: Failing tests**

`tests/unit/slug.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { defaultWriteupSlug, slugify } from "@/lib/slug";

describe("slug", () => {
  it("slugifies", () => {
    expect(slugify("  MATH6025 - Discrete Mathematics ")).toBe("math6025-discrete-mathematics");
    expect(slugify("Sudah lamá!!")).toBe("sudah-lama");
    expect(slugify("x".repeat(200))).toHaveLength(80);
    expect(slugify("!!!")).toBe("");
  });
  it("matches the legacy category-title pattern", () => {
    expect(defaultWriteupSlug("Pwn", "Truman")).toBe("pwn-truman");
    expect(defaultWriteupSlug(null, "Truman")).toBe("truman");
  });
});
```

Append to `tests/unit/admin-schemas.test.ts`:
```ts
import { WriteupSchema } from "@/lib/admin/schemas";

describe("WriteupSchema", () => {
  it("parses attachments JSON and rejects bad slugs", () => {
    const r = WriteupSchema.parse({ title: "Truman", slug: "", content: "<p>x</p>", attachments: '[{"url":"/api/public/uploads/a","name":"a","contentType":"application/octet-stream"}]', tags: "PWN, heap" });
    expect(r.slug).toBeNull();
    expect(r.attachments).toHaveLength(1);
    expect(r.tags).toEqual(["PWN", "heap"]);
    expect(WriteupSchema.safeParse({ title: "a", slug: "Bad Slug", content: "" }).success).toBe(false);
    expect(WriteupSchema.safeParse({ title: "a", content: "", attachments: "not json" }).success).toBe(false);
  });
});
```

Append to `tests/unit/uploads.test.ts`, inside `describe("read / delete", …)`:
```ts
  it("writeUploadBuffer stores import assets with sanitized names", async () => {
    const saved = await mod.writeUploadBuffer("../../evil name.png", Buffer.from([1]));
    expect(saved.name).toMatch(/^[0-9a-f-]{36}-evil-name\.png$/);
    expect(saved.contentType).toBe("image/png");
    expect(await mod.deleteUpload(saved.name)).toBe(200);
  });
```

Run: FAIL.

- [ ] **Step 2: Implement**

`src/lib/slug.ts`:
```ts
export function slugify(s: string): string {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export function defaultWriteupSlug(category: string | null, title: string): string {
  return slugify(`${category ?? ""} ${title}`);
}
```

Append to `src/lib/admin/schemas.ts`:
```ts
const attachment = z.object({ url: z.string().regex(/^(\/(?!\/)|https?:\/\/)/), name: z.string().max(300), contentType: z.string().max(200) });

export const WriteupSchema = z.object({
  id,
  title: z.string().trim().min(1, "Title is required").max(300),
  slug: z.preprocess(blankToNull, z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "lowercase-with-dashes only").max(80).nullable().default(null)),
  competition: optText(200),
  category: optText(60),
  difficulty: optText(40),
  date: dateField,
  summary: optText(1000),
  content: z.string().max(5_000_000).default(""),
  flag: optText(300),
  tags: tagsField,
  attachments: z
    .preprocess((v) => {
      if (typeof v !== "string" || v.trim() === "") return [];
      try {
        return JSON.parse(v);
      } catch {
        return "__invalid__";
      }
    }, z.array(attachment).max(50))
    .default([]),
});
```

Append to `src/lib/uploads.ts`:
```ts
export async function writeUploadBuffer(originalName: string, buf: Buffer) {
  const name = toStoredName(originalName);
  await mkdir(UPLOADS_DIR, { recursive: true });
  await writeFile(path.join(UPLOADS_DIR, name), buf);
  return { name, url: publicUploadUrl(name), contentType: mimeFor(name) };
}
```

Run: `pnpm test`. Expected: PASS.

- [ ] **Step 3: Port the PDF/Notion import route.** Install deps, then copy and adapt:

```bash
pnpm add pdf-parse jszip marked
cp .legacy/src/app/api/admin/writeups/import-pdf/route.ts src/app/api/admin/writeups/import-pdf/route.ts
```

Edit the copied file:
1. Replace `import { getSessionFromRequest } from '@/lib/session';` with `import { COOKIE_NAME, verifySessionToken } from '@/lib/session';`.
2. Replace `import { uploadFileToUploadsFolder } from '@/lib/upload-storage';` with `import { writeUploadBuffer } from '@/lib/uploads';`.
3. Replace the body of `uploadBufferAsset` with:
```ts
async function uploadBufferAsset(fileName: string, buffer: Buffer): Promise<string> {
  return (await writeUploadBuffer(path.basename(fileName), buffer)).url;
}
```
4. In `POST`, replace `if (!getSessionFromRequest(req)) {` with `if (!verifySessionToken(req.cookies.get(COOKIE_NAME)?.value)) {`.
5. Delete the now-unused helpers `sanitizeFileName` / `getMimeType` and the `randomUUID` import if TypeScript or ESLint flags them unused.

Add `serverExternalPackages: ["pdf-parse"]` to `next.config.ts` (pdf-parse loads a worker at runtime).

Run `pnpm typecheck`. Expected: PASS.

- [ ] **Step 4: Rich editor (Tiptap 3).** Install and port `.legacy/src/components/RichEditor.tsx`:

```bash
pnpm add @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-table @tiptap/extension-placeholder
```

Tiptap 3 changes versus legacy v2:
- `StarterKit` already includes `Link` and `Underline`. Remove those separate imports and configure via `StarterKit.configure({ link: { openOnClick: false, autolink: true } })`.
- Tables: `import { TableKit } from "@tiptap/extension-table"` and use `TableKit.configure({ table: { resizable: false } })` instead of 4 extensions.
- `useEditor({ immediatelyRender: false, ... })` is required for SSR.

`src/components/admin/rich-editor.tsx`:
```tsx
"use client";

import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { uploadFile } from "@/components/admin/image-field";
import { cn } from "@/lib/utils";

type Props = { name: string; defaultValue?: string; externalValue?: { html: string; nonce: number } };

export function RichEditor({ name, defaultValue = "", externalValue }: Props) {
  const [html, setHtml] = useState(defaultValue);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true }, heading: { levels: [2, 3, 4] } }),
      Image,
      TableKit.configure({ table: { resizable: false } }),
      Placeholder.configure({ placeholder: "Explain the bug, the primitive, the exploit…" }),
    ],
    content: defaultValue,
    editorProps: { attributes: { class: "writeup-prose min-h-[480px] max-w-none p-4 outline-none" } },
    onUpdate: ({ editor }) => setHtml(editor.getHTML()),
  });

  // Content arriving from PDF import replaces the document.
  useEffect(() => {
    if (editor && externalValue) {
      editor.commands.setContent(externalValue.html);
      setHtml(editor.getHTML());
    }
  }, [editor, externalValue]);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      code: e?.isActive("code") ?? false,
      codeBlock: e?.isActive("codeBlock") ?? false,
      bullet: e?.isActive("bulletList") ?? false,
      ordered: e?.isActive("orderedList") ?? false,
      quote: e?.isActive("blockquote") ?? false,
    }),
  });

  const btn = (active: boolean | undefined) => cn("rounded px-2 py-1 font-mono text-xs", active ? "bg-primary text-primary-foreground" : "hover:bg-secondary");
  const c = () => editor!.chain().focus();

  return (
    <div className="rounded-md border border-input">
      <div className="flex flex-wrap gap-1 border-b border-input p-2">
        <button type="button" className={btn(s?.h2)} onClick={() => c().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" className={btn(s?.h3)} onClick={() => c().toggleHeading({ level: 3 }).run()}>H3</button>
        <button type="button" className={btn(s?.bold)} onClick={() => c().toggleBold().run()}>B</button>
        <button type="button" className={btn(s?.italic)} onClick={() => c().toggleItalic().run()}>I</button>
        <button type="button" className={btn(s?.code)} onClick={() => c().toggleCode().run()}>`code`</button>
        <button type="button" className={btn(s?.codeBlock)} onClick={() => c().toggleCodeBlock().run()}>{"{ }"}</button>
        <button type="button" className={btn(s?.bullet)} onClick={() => c().toggleBulletList().run()}>• list</button>
        <button type="button" className={btn(s?.ordered)} onClick={() => c().toggleOrderedList().run()}>1. list</button>
        <button type="button" className={btn(s?.quote)} onClick={() => c().toggleBlockquote().run()}>quote</button>
        <button
          type="button"
          className={btn(false)}
          onClick={() => {
            const href = prompt("Link URL");
            if (href) c().setLink({ href }).run();
            else c().unsetLink().run();
          }}
        >
          link
        </button>
        <button type="button" className={btn(false)} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>table</button>
        <label className={cn(btn(false), "cursor-pointer")}>
          image
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                c().setImage({ src: await uploadFile(f), alt: f.name }).run();
              } catch (err) {
                toast.error((err as Error).message);
              }
            }}
          />
        </label>
      </div>
      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={html} />
    </div>
  );
}
```

- [ ] **Step 5: Attachments field + PDF import button**

`src/components/admin/attachments-field.tsx`:
```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Attachment } from "@/lib/types";

export function AttachmentsField({ name, defaultValue = [] }: { name: string; defaultValue?: Attachment[] }) {
  const [items, setItems] = useState<Attachment[]>(defaultValue);
  return (
    <div className="grid gap-3">
      <ul className="grid gap-1">
        {items.map((a, i) => (
          <li key={a.url} className="flex items-center justify-between gap-4 text-sm">
            <a href={a.url} className="truncate font-mono text-xs">{a.name}</a>
            <Button type="button" variant="ghost" size="sm" onClick={() => setItems(items.filter((_, j) => j !== i))}>remove</Button>
          </li>
        ))}
      </ul>
      <Button type="button" variant="secondary" className="w-fit" asChild>
        <label className="cursor-pointer">
          Add attachment
          <input
            type="file"
            className="sr-only"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const fd = new FormData();
              fd.append("file", f);
              const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
              const json = await res.json();
              if (!res.ok) return toast.error(json.error);
              setItems([...items, { url: json.url, name: json.name, contentType: json.contentType }]);
            }}
          />
        </label>
      </Button>
      <input type="hidden" name={name} value={JSON.stringify(items)} />
    </div>
  );
}
```

`src/components/admin/pdf-import.tsx`:
```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ImportedDoc = { title: string; summary: string; content: string };

export function PdfImport({ onImported }: { onImported: (d: ImportedDoc) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button type="button" variant="outline" disabled={busy} asChild>
      <label className="cursor-pointer">
        {busy ? "Importing…" : "Import PDF / Notion ZIP"}
        <input
          type="file"
          accept=".pdf,.zip,application/pdf,application/zip"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            const fd = new FormData();
            fd.append("file", f);
            const res = await fetch("/api/admin/writeups/import-pdf", { method: "POST", body: fd }).catch(() => null);
            const json = await res?.json().catch(() => null);
            setBusy(false);
            if (!res?.ok) return toast.error(json?.error ?? "Import failed");
            onImported(json);
            toast.success("Imported — review before saving");
          }}
        />
      </label>
    </Button>
  );
}
```

- [ ] **Step 6: Writeup actions** (`src/lib/admin/actions/writeups.ts`)

```ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { WriteupSchema } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";
import { defaultWriteupSlug } from "@/lib/slug";

export async function saveWriteup(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = WriteupSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { id, tags, attachments, slug, ...rest } = parsed.data;
  const finalSlug = slug ?? (defaultWriteupSlug(rest.category, rest.title) || null);
  if (finalSlug) {
    const clash = await prisma.writeup.findFirst({ where: { slug: finalSlug, NOT: id ? { id } : undefined }, select: { id: true } });
    if (clash) return { ok: false, message: "Slug already used.", fields: { slug: [`"${finalSlug}" is taken by another writeup`] } };
  }
  const data = { ...rest, slug: finalSlug, tagsJson: tags, attachmentsJson: attachments };
  if (id) await prisma.writeup.update({ where: { id }, data });
  else await prisma.writeup.create({ data });
  revalidatePath("/admin/writeups");
  redirect("/admin/writeups");
}

export async function deleteWriteup(id: string) {
  await requireAdmin();
  await prisma.writeup.delete({ where: { id } });
  revalidatePath("/admin/writeups");
}
```

- [ ] **Step 7: Writeup form + pages**

`src/components/admin/writeup-form.tsx`:
```tsx
"use client";

import { useActionState, useState } from "react";
import { AttachmentsField } from "@/components/admin/attachments-field";
import { Field } from "@/components/admin/field";
import { PdfImport } from "@/components/admin/pdf-import";
import { RichEditor } from "@/components/admin/rich-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveWriteup } from "@/lib/admin/actions/writeups";
import type { ActionState } from "@/lib/admin/form";
import type { Attachment } from "@/lib/types";

export type WriteupInitial = {
  id?: string; title?: string | null; slug?: string | null; competition?: string | null; category?: string | null; difficulty?: string | null;
  date?: string | null; summary?: string | null; content?: string | null; flag?: string | null; tags?: string[]; attachments?: Attachment[];
};

const CATEGORIES = ["Pwn", "Reverse", "Forensics", "Crypto", "Web", "Misc", "OSINT"];

export function WriteupForm({ initial = {} }: { initial?: WriteupInitial }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveWriteup, { ok: true });
  const [title, setTitle] = useState(initial.title ?? "");
  const [summary, setSummary] = useState(initial.summary ?? "");
  const [imported, setImported] = useState<{ html: string; nonce: number }>();
  const f = state.fields ?? {};
  return (
    <form action={action} className="grid gap-6">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="flex justify-end">
        <PdfImport
          onImported={(d) => {
            if (d.title) setTitle(d.title);
            if (d.summary) setSummary(d.summary);
            setImported({ html: d.content, nonce: Date.now() });
          }}
        />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Title" name="title" error={f.title}>
          <Input id="title" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </Field>
        <Field label="Slug" name="slug" hint="Empty = category-title" error={f.slug}>
          <Input id="slug" name="slug" defaultValue={initial.slug ?? ""} />
        </Field>
        <Field label="Category" name="category" error={f.category}>
          <Input id="category" name="category" list="categories" defaultValue={initial.category ?? "Pwn"} />
          <datalist id="categories">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Competition" name="competition" error={f.competition}>
          <Input id="competition" name="competition" defaultValue={initial.competition ?? ""} />
        </Field>
        <Field label="Difficulty" name="difficulty" error={f.difficulty}>
          <Input id="difficulty" name="difficulty" list="difficulties" defaultValue={initial.difficulty ?? ""} />
          <datalist id="difficulties">{["Easy", "Medium", "Hard", "Insane"].map((d) => <option key={d} value={d} />)}</datalist>
        </Field>
        <Field label="Date" name="date" error={f.date}>
          <Input id="date" name="date" type="date" defaultValue={initial.date ?? ""} />
        </Field>
      </div>
      <Field label="Summary" name="summary" error={f.summary}>
        <Textarea id="summary" name="summary" rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field label="Tags" name="tags" hint="Comma separated" error={f.tags}>
        <Input id="tags" name="tags" defaultValue={(initial.tags ?? []).join(", ")} />
      </Field>
      <Field label="Content" name="content" error={f.content}>
        <RichEditor name="content" defaultValue={initial.content ?? ""} externalValue={imported} />
      </Field>
      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Flag" name="flag" error={f.flag}>
          <Input id="flag" name="flag" defaultValue={initial.flag ?? ""} className="font-mono" />
        </Field>
        <Field label="Attachments" name="attachments" error={f.attachments}>
          <AttachmentsField name="attachments" defaultValue={initial.attachments} />
        </Field>
      </div>
      {state.message && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">{pending ? "Saving…" : "Save writeup"}</Button>
    </form>
  );
}
```

`src/app/admin/(panel)/writeups/page.tsx`:
```tsx
import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteWriteup } from "@/lib/admin/actions/writeups";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function WriteupsAdmin() {
  await requireAdmin();
  const rows = await prisma.writeup.findMany({ orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], select: { id: true, title: true, slug: true, category: true, competition: true, date: true } });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold tracking-tight">Writeups <span className="meta">{rows.length}</span></h1>
        <Button asChild><Link href="/admin/writeups/new">New writeup</Link></Button>
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {rows.map((w) => (
          <li key={w.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 md:grid-cols-[1fr_8rem_12rem_7rem_auto]">
            <Link href={`/admin/writeups/${w.id}`} className="font-medium hover:text-primary">{w.title ?? "Untitled"}</Link>
            <span className="meta hidden md:block">{w.category}</span>
            <span className="meta hidden md:block">{w.competition}</span>
            <span className="meta hidden md:block">{w.date?.toISOString().slice(0, 10) ?? "undated"}</span>
            <div className="flex items-center gap-2">
              <a href={`/writeups/${w.slug ?? w.id}`} target="_blank" className="meta hover:text-foreground">view</a>
              <DeleteButton action={deleteWriteup.bind(null, w.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

`src/app/admin/(panel)/writeups/new/page.tsx`:
```tsx
import { WriteupForm } from "@/components/admin/writeup-form";
import { requireAdmin } from "@/lib/admin/guard";

export default async function NewWriteup() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">New writeup</h1>
      <WriteupForm />
    </div>
  );
}
```

`src/app/admin/(panel)/writeups/[id]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { WriteupForm } from "@/components/admin/writeup-form";
import { requireAdmin } from "@/lib/admin/guard";
import { toWriteupDetail } from "@/lib/data/mappers";
import { prisma } from "@/lib/db";

export default async function EditWriteup({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const row = await prisma.writeup.findUnique({ where: { id: (await params).id } }).catch(() => null);
  if (!row) notFound();
  const d = toWriteupDetail(row);
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Edit writeup</h1>
      <WriteupForm
        initial={{
          id: row.id, title: row.title, slug: row.slug, competition: row.competition, category: row.category, difficulty: row.difficulty,
          date: row.date?.toISOString().slice(0, 10) ?? null, summary: row.summary, content: row.content, flag: row.flag, tags: d.tags, attachments: d.attachments,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 8: Verify (sandbox disabled).** Logged in:
  1. Open `pwn-truman` in the editor, change nothing and save. Then diff `content` in the DB against a pre-save copy, which must be semantically equal. Tiptap normalises HTML, so whitespace/attribute-order differences are acceptable, but every `<img src>` and `<pre><code>` must survive (`grep -o 'src="[^"]*"' | sort` before and after).
  2. Create a writeup with an empty slug and category Pwn, title "Test Bof". Expect slug `pwn-test-bof`.
  3. Create a second one with the same title. Expect a field error on slug.
  4. Import a small PDF (`.legacy/` has none, so use any PDF on disk). Expect title, summary and content prefilled.
  5. Delete the test writeups.

```bash
pnpm test && pnpm typecheck && pnpm lint
git add -A && git commit -m "feat(admin): writeup editor (Tiptap 3), slugs, attachments, PDF/Notion import

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Admin profile settings

**Files:**
- Create: `src/lib/admin/actions/profile.ts`, `src/components/admin/list-editor.tsx`, `src/components/admin/profile-form.tsx`, `src/app/admin/(panel)/profile/page.tsx`
- Modify: `src/lib/admin/schemas.ts` (add `ProfileSchema`)
- Test: extend `tests/unit/admin-schemas.test.ts`

**Interfaces:**
- Produces:
  - `ProfileSchema`: scalar fields (`displayName`, `alias`, `navbarBrandMode: "default" | "custom"`, `navbarBrandName`, `email`, `websiteUrl`, `githubUrl`, `instagramUrl`, `profileImageUrl`, `aboutText`, `philosophyText`), plus JSON-string fields `technicalArsenal` (array of `{name, level 0–100}`), `professionalJourney` (array of `{role, company, period, desc}`), `educationHistory` (array of `{level, school, period}`), and `seo` (object `{jobTitle?, locale?, description?, keywords: string[], sameAs: string[]}`).
  - `saveProfile(prev, fd): Promise<ActionState>` (upsert `id: "main"`, returns `{ ok: true, message: "Saved" }`).
  - `<ListEditor name columns={[{key,label,type?: "text"|"number"|"textarea"}]} defaultValue />`: repeatable rows serialized to a hidden JSON input.

- [ ] **Step 1: Failing test** (append to `tests/unit/admin-schemas.test.ts`)

```ts
import { ProfileSchema } from "@/lib/admin/schemas";

describe("ProfileSchema", () => {
  it("parses JSON list fields and clamps nothing silently", () => {
    const r = ProfileSchema.parse({
      displayName: "Elang Dimas Syadewa", alias: "Claritys", navbarBrandMode: "custom", navbarBrandName: "Claritys",
      technicalArsenal: '[{"name":"Binary Exploitation","level":85}]',
      professionalJourney: "[]", educationHistory: '[{"level":"SMK","school":"SMK Telkom Malang","period":"2025 - Now"}]',
      seo: '{"keywords":["CTF"],"sameAs":["https://github.com/Claritys11"],"jobTitle":"Cybersecurity Specialist"}',
    });
    expect(r.technicalArsenal[0]).toEqual({ name: "Binary Exploitation", level: 85 });
    expect(r.seo.keywords).toEqual(["CTF"]);
  });
  it("rejects level > 100 and bad brand mode", () => {
    expect(ProfileSchema.safeParse({ technicalArsenal: '[{"name":"x","level":101}]' }).success).toBe(false);
    expect(ProfileSchema.safeParse({ navbarBrandMode: "weird" }).success).toBe(false);
  });
});
```

Run: FAIL.

- [ ] **Step 2: Schema** (append to `src/lib/admin/schemas.ts`)

```ts
const jsonField = <T extends z.ZodTypeAny>(inner: T, empty: unknown) =>
  z.preprocess((v) => {
    if (typeof v !== "string" || v.trim() === "") return empty;
    try {
      return JSON.parse(v);
    } catch {
      return "__invalid__";
    }
  }, inner);

export const ProfileSchema = z.object({
  displayName: optText(120),
  alias: optText(60),
  navbarBrandMode: z.enum(["default", "custom"]).default("default"),
  navbarBrandName: optText(60),
  email: z.preprocess(blankToNull, z.email().nullable().default(null)),
  websiteUrl: linkUrl,
  githubUrl: linkUrl,
  instagramUrl: linkUrl,
  profileImageUrl: mediaUrl,
  aboutText: optText(5000),
  philosophyText: optText(500),
  technicalArsenal: jsonField(z.array(z.object({ name: z.string().trim().min(1).max(80), level: z.coerce.number().int().min(0).max(100) })).max(40), []),
  professionalJourney: jsonField(z.array(z.object({ role: z.string().max(120), company: z.string().max(120), period: z.string().max(60), desc: z.string().max(1000) })).max(40), []),
  educationHistory: jsonField(z.array(z.object({ level: z.string().max(80), school: z.string().max(160), period: z.string().max(60) })).max(20), []),
  seo: jsonField(
    z.object({
      jobTitle: z.string().max(120).optional(),
      locale: z.string().max(20).optional(),
      description: z.string().max(300).optional(),
      keywords: z.array(z.string().max(60)).max(60).default([]),
      sameAs: z.array(z.string().url()).max(20).default([]),
    }),
    {},
  ),
});
```

Run: PASS.

- [ ] **Step 3: Action** (`src/lib/admin/actions/profile.ts`)

```ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { ProfileSchema } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";

export async function saveProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = ProfileSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { technicalArsenal, professionalJourney, educationHistory, seo, ...scalars } = parsed.data;
  const data = {
    ...scalars,
    technicalArsenalJson: technicalArsenal,
    professionalJourneyJson: professionalJourney,
    educationHistoryJson: educationHistory,
    seoSettingsJson: seo,
  };
  await prisma.profileSettings.upsert({ where: { id: "main" }, create: { id: "main", ...data }, update: data });
  revalidatePath("/admin/profile");
  return { ok: true, message: "Saved" };
}
```

- [ ] **Step 4: ListEditor** (`src/components/admin/list-editor.tsx`)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Column = { key: string; label: string; type?: "text" | "number" | "textarea" };
type Row = Record<string, string | number>;

export function ListEditor({ name, columns, defaultValue }: { name: string; columns: Column[]; defaultValue: Row[] }) {
  const [rows, setRows] = useState<Row[]>(defaultValue);
  const update = (i: number, key: string, value: string, type?: Column["type"]) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [key]: type === "number" ? Number(value) : value } : r)));
  const move = (i: number, d: -1 | 1) => {
    const next = [...rows];
    const [r] = next.splice(i, 1);
    next.splice(i + d, 0, r);
    setRows(next);
  };
  return (
    <div className="grid gap-3">
      {rows.map((r, i) => (
        <div key={i} className="grid gap-2 rounded-md border border-border p-3">
          <div className="grid gap-2 md:grid-cols-3">
            {columns.map((c) =>
              c.type === "textarea" ? (
                <Textarea key={c.key} aria-label={c.label} placeholder={c.label} className="md:col-span-3" value={String(r[c.key] ?? "")} onChange={(e) => update(i, c.key, e.target.value)} />
              ) : (
                <Input key={c.key} aria-label={c.label} placeholder={c.label} type={c.type ?? "text"} value={String(r[c.key] ?? "")} onChange={(e) => update(i, c.key, e.target.value, c.type)} />
              ),
            )}
          </div>
          <div className="flex gap-1">
            <Button type="button" size="sm" variant="ghost" disabled={i === 0} onClick={() => move(i, -1)}>↑</Button>
            <Button type="button" size="sm" variant="ghost" disabled={i === rows.length - 1} onClick={() => move(i, 1)}>↓</Button>
            <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => setRows(rows.filter((_, j) => j !== i))}>remove</Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" className="w-fit" onClick={() => setRows([...rows, Object.fromEntries(columns.map((c) => [c.key, c.type === "number" ? 0 : ""]))])}>
        Add row
      </Button>
      <input type="hidden" name={name} value={JSON.stringify(rows)} />
    </div>
  );
}
```

- [ ] **Step 5: Profile form + page**

`src/components/admin/profile-form.tsx`:
```tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { Field } from "@/components/admin/field";
import { ImageField } from "@/components/admin/image-field";
import { ListEditor } from "@/components/admin/list-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveProfile } from "@/lib/admin/actions/profile";
import type { ActionState } from "@/lib/admin/form";

export type ProfileInitial = {
  displayName: string; alias: string; navbarBrandMode: string; navbarBrandName: string; email: string; websiteUrl: string; githubUrl: string; instagramUrl: string;
  profileImageUrl: string; aboutText: string; philosophyText: string;
  technicalArsenal: { name: string; level: number }[]; professionalJourney: { role: string; company: string; period: string; desc: string }[];
  educationHistory: { level: string; school: string; period: string }[];
  seo: { jobTitle?: string; locale?: string; description?: string; keywords: string[]; sameAs: string[] };
};

export function ProfileForm({ initial }: { initial: ProfileInitial }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProfile, { ok: true });
  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);
  const f = state.fields ?? {};
  const text = (name: keyof ProfileInitial, label: string) => (
    <Field label={label} name={name} error={f[name]}>
      <Input id={name} name={name} defaultValue={String(initial[name] ?? "")} />
    </Field>
  );
  return (
    <form action={action} className="grid max-w-3xl gap-8">
      <div className="grid gap-6 md:grid-cols-2">
        {text("displayName", "Display name")}
        {text("alias", "Alias (also the footer glitch word)")}
        <Field label="Navbar brand" name="navbarBrandMode" error={f.navbarBrandMode}>
          <select id="navbarBrandMode" name="navbarBrandMode" defaultValue={initial.navbarBrandMode} className="h-9 rounded-md border border-input bg-transparent px-3 text-sm">
            <option value="default">Use alias</option>
            <option value="custom">Custom name</option>
          </select>
        </Field>
        {text("navbarBrandName", "Custom brand name")}
        {text("email", "Email")}
        {text("websiteUrl", "Website")}
        {text("githubUrl", "GitHub")}
        {text("instagramUrl", "Instagram")}
      </div>
      <Field label="Profile image" name="profileImageUrl" error={f.profileImageUrl}>
        <ImageField name="profileImageUrl" defaultValue={initial.profileImageUrl} />
      </Field>
      <Field label="About" name="aboutText" hint="The first two sentences appear on the home page." error={f.aboutText}>
        <Textarea id="aboutText" name="aboutText" rows={6} defaultValue={initial.aboutText} />
      </Field>
      <Field label="Philosophy / quote" name="philosophyText" hint='Format: "Quote." -Author' error={f.philosophyText}>
        <Input id="philosophyText" name="philosophyText" defaultValue={initial.philosophyText} />
      </Field>
      <Field label="Skills (Pwn / Binary Exploitation is always shown first)" name="technicalArsenal" error={f.technicalArsenal}>
        <ListEditor name="technicalArsenal" columns={[{ key: "name", label: "Skill" }, { key: "level", label: "Level 0–100", type: "number" }]} defaultValue={initial.technicalArsenal} />
      </Field>
      <Field label="Journey" name="professionalJourney" error={f.professionalJourney}>
        <ListEditor name="professionalJourney" columns={[{ key: "role", label: "Role" }, { key: "company", label: "Place" }, { key: "period", label: "Period" }, { key: "desc", label: "Description", type: "textarea" }]} defaultValue={initial.professionalJourney} />
      </Field>
      <Field label="Education" name="educationHistory" error={f.educationHistory}>
        <ListEditor name="educationHistory" columns={[{ key: "level", label: "Level" }, { key: "school", label: "School" }, { key: "period", label: "Period" }]} defaultValue={initial.educationHistory} />
      </Field>
      <fieldset className="grid gap-4 rounded-md border border-border p-4">
        <legend className="meta px-2">SEO</legend>
        <SeoFields initial={initial.seo} error={f.seo} />
      </fieldset>
      {state.message && !state.ok && <p className="text-sm text-destructive">{state.message}</p>}
      <Button type="submit" disabled={pending} className="w-fit">{pending ? "Saving…" : "Save profile"}</Button>
    </form>
  );
}

function SeoFields({ initial, error }: { initial: ProfileInitial["seo"]; error?: string[] }) {
  const [seo, setSeo] = useState(initial);
  const list = (k: "keywords" | "sameAs") => seo[k].join(", ");
  const setList = (k: "keywords" | "sameAs", v: string) => setSeo({ ...seo, [k]: v.split(",").map((s) => s.trim()).filter(Boolean) });
  return (
    <>
      <Input aria-label="Job title" placeholder="Job title" value={seo.jobTitle ?? ""} onChange={(e) => setSeo({ ...seo, jobTitle: e.target.value })} />
      <Input aria-label="Locale" placeholder="Locale (id_ID)" value={seo.locale ?? ""} onChange={(e) => setSeo({ ...seo, locale: e.target.value })} />
      <Textarea aria-label="Description" placeholder="Meta description" value={seo.description ?? ""} onChange={(e) => setSeo({ ...seo, description: e.target.value })} />
      <Textarea aria-label="Keywords" placeholder="Keywords, comma separated" value={list("keywords")} onChange={(e) => setList("keywords", e.target.value)} />
      <Textarea aria-label="Same as" placeholder="Profile URLs, comma separated" value={list("sameAs")} onChange={(e) => setList("sameAs", e.target.value)} />
      {error?.[0] && <p className="text-sm text-destructive">{error[0]}</p>}
      <input type="hidden" name="seo" value={JSON.stringify(seo)} />
    </>
  );
}
```

`src/app/admin/(panel)/profile/page.tsx`:
```tsx
import { ProfileForm } from "@/components/admin/profile-form";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { parseObjectArray, parseRecord, parseStringArray } from "@/lib/json";

export default async function ProfilePage() {
  await requireAdmin();
  const r = await prisma.profileSettings.findUnique({ where: { id: "main" } });
  const seo = parseRecord(r?.seoSettingsJson);
  const s = (v: string | null | undefined) => v ?? "";
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Profile</h1>
      <ProfileForm
        initial={{
          displayName: s(r?.displayName), alias: s(r?.alias), navbarBrandMode: r?.navbarBrandMode ?? "default", navbarBrandName: s(r?.navbarBrandName),
          email: s(r?.email), websiteUrl: s(r?.websiteUrl), githubUrl: s(r?.githubUrl), instagramUrl: s(r?.instagramUrl),
          profileImageUrl: s(r?.profileImageUrl), aboutText: s(r?.aboutText), philosophyText: s(r?.philosophyText),
          technicalArsenal: parseObjectArray(r?.technicalArsenalJson, (x) => (typeof x.name === "string" ? { name: x.name, level: Number(x.level) || 0 } : null)),
          professionalJourney: parseObjectArray(r?.professionalJourneyJson, (x) => (typeof x.role === "string" ? { role: x.role, company: String(x.company ?? ""), period: String(x.period ?? ""), desc: String(x.desc ?? "") } : null)),
          educationHistory: parseObjectArray(r?.educationHistoryJson, (x) => (typeof x.school === "string" ? { level: String(x.level ?? ""), school: x.school, period: String(x.period ?? "") } : null)),
          seo: {
            jobTitle: typeof seo.jobTitle === "string" ? seo.jobTitle : undefined,
            locale: typeof seo.locale === "string" ? seo.locale : undefined,
            description: typeof seo.description === "string" ? seo.description : undefined,
            keywords: parseStringArray(seo.keywords),
            sameAs: parseStringArray(seo.sameAs),
          },
        }}
      />
    </div>
  );
}
```

- [ ] **Step 6: Verify (sandbox disabled).**
  1. Save the profile without changes, then confirm `profile_settings` JSON columns are unchanged: `select technical_arsenal_json, seo_settings_json from profile_settings` before and after must be equal as JSON.
  2. Change the alias to `Claritys2`. Confirm the footer glitch word becomes `CLARITYS2`, then revert.

```bash
pnpm test && pnpm typecheck && pnpm lint
git add -A && git commit -m "feat(admin): profile settings with structured list editors

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: Docker, compose, README

**Files:**
- Create: `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `README.md`, `scripts/restore.sh`

**Interfaces:**
- Produces: an image serving on port 3000. Its entrypoint runs `prisma migrate deploy` and then `node server.js`. Volumes: `/app/public/uploads`. Env: as `.env.example`.

- [ ] **Step 1: `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1
FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build pnpm prisma generate && pnpm build

FROM node:24-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps /app/node_modules/dotenv ./node_modules/dotenv
RUN mkdir -p public/uploads && chown -R app:app public/uploads
USER app
EXPOSE 3000
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
```

`.dockerignore`:
```
node_modules
.next
.git
.legacy
*.dump
*.tar.gz
public/uploads
.env*
!.env.example
test-results
playwright-report
src/generated
```

- [ ] **Step 2: `docker-compose.yml`**

```yaml
services:
  app:
    build: .
    restart: unless-stopped
    env_file: .env.production
    environment:
      DATABASE_URL: postgresql://portfolio:${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}@db:5432/portfolio
    ports:
      - "127.0.0.1:3020:3000"
    volumes:
      - uploads:/app/public/uploads
    depends_on:
      db:
        condition: service_healthy
  db:
    image: postgres:18-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: portfolio
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?set POSTGRES_PASSWORD}
      POSTGRES_DB: portfolio
    volumes:
      - pgdata:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U portfolio"]
      interval: 5s
      retries: 10
volumes:
  uploads:
  pgdata:
```

- [ ] **Step 3: `scripts/restore.sh`** (restore a dump and uploads archive into the compose stack)

```bash
#!/usr/bin/env bash
# Usage: scripts/restore.sh portfolio-YYYY-MM-DD.dump uploads-YYYY-MM-DD.tar.gz
set -euo pipefail
DUMP=${1:?dump file}; UPLOADS=${2:?uploads archive}
docker compose up -d db
docker compose cp "$DUMP" db:/tmp/restore.dump
docker compose exec -T db pg_restore -U portfolio -d portfolio --clean --if-exists --no-owner --no-acl /tmp/restore.dump
docker compose run --rm --no-deps -v "$(realpath "$UPLOADS"):/tmp/u.tar.gz:ro" --entrypoint sh app -c 'tar xzf /tmp/u.tar.gz -C /app/public'
echo "restored. start with: docker compose up -d"
```
`chmod +x scripts/restore.sh`.

- [ ] **Step 4: `README.md`.** Sections:
  - What it is (one paragraph).
  - Stack.
  - Local dev: dev DB container command from the Global Constraints, `pnpm i`, `cp .env.example .env.local`, `pnpm prisma migrate deploy`, extract uploads, `pnpm dev`.
  - Scripts table (`dev`, `test`, `e2e`, `typecheck`, `check`, `db:migrate`).
  - Deploy with compose + `scripts/restore.sh`, and the Coolify note (set the same env vars and mount `/app/public/uploads` as a persistent volume).
  - Admin (`/admin`, env credentials).
  - The design rules from the spec §4 in brief (the five hacker details, nothing else).

- [ ] **Step 5: Build the image and smoke test** (sandbox disabled):

```bash
docker build -t newportfolio:test . 
docker run --rm -d --name np-smoke --network newportfolio_default -e DATABASE_URL=postgresql://portfolio:portfolio@newportfolio-db:5432/portfolio -e ADMIN_USERNAME=admin -e ADMIN_PASSWORD=x -e ADMIN_SESSION_SECRET=$(openssl rand -base64 48) -v "$PWD/public/uploads:/app/public/uploads:ro" -p 127.0.0.1:3021:3000 newportfolio:test
sleep 8; curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3021/ ; curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3021/writeups/pwn-truman
docker logs np-smoke | tail -5; docker rm -f np-smoke
```
Expected: `200` `200`, and the logs show migrate deploy "No pending migrations". If the standalone server can't find `pdf-parse`, add `outputFileTracingIncludes: { "/api/admin/writeups/import-pdf": ["./node_modules/pdf-parse/**"] }` to `next.config.ts`.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: Dockerfile, compose stack, restore script, README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: End-to-end tests and final verification

**Files:**
- Create: `playwright.config.ts`, `e2e/public.spec.ts`, `e2e/admin.spec.ts`

**Interfaces:**
- Consumes: the running app against the restored dev DB, and `.env.local` admin credentials.

- [ ] **Step 1: `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure" },
  webServer: { command: "pnpm build && pnpm start -p 3100", url: "http://localhost:3100", timeout: 240_000, reuseExistingServer: true },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    { name: "reduced-motion", use: { ...devices["Desktop Chrome"], contextOptions: { reducedMotion: "reduce" } } },
  ],
});
```

Run `pnpm exec playwright install chromium`.

Note: `next start` with `output: "standalone"` warns but works. If it refuses, use `node .next/standalone/server.js` with `PORT=3100` and copy `.next/static` + `public` into `.next/standalone` first.

- [ ] **Step 2: `e2e/public.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test("home renders real content without horizontal overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("ELANG");
  await expect(page.getByText("pwn · rev · forensics")).toBeVisible();
  await expect(page.getByRole("link", { name: /Truman/ }).first()).toBeAttached();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("all sections become visible after scrolling (nothing stuck at opacity 0)", async ({ page }) => {
  await page.goto("/");
  for (let y = 0; y < 30; y++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(1200);
  const hidden = await page.$$eval("main li, main h2, main p", (els) =>
    els.filter((e) => {
      const r = e.getBoundingClientRect();
      return r.height > 0 && getComputedStyle(e).opacity === "0" && !e.closest("[aria-hidden]");
    }).length,
  );
  expect(hidden).toBe(0);
});

test("writeup article loads uploads images and reveals flag", async ({ page }) => {
  const imgResponses: number[] = [];
  page.on("response", (r) => r.url().includes("/api/public/uploads/") && imgResponses.push(r.status()));
  await page.goto("/writeups/pwn-truman");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Truman");
  await page.locator("article img").first().scrollIntoViewIfNeeded();
  await expect.poll(() => imgResponses.length).toBeGreaterThan(0);
  expect(imgResponses.every((s) => s === 200)).toBe(true);
  const reveal = page.getByRole("button", { name: "Reveal flag" });
  if (await reveal.count()) {
    await reveal.click();
    await expect(page.locator("code", { hasText: /\{.*\}/ })).toBeVisible();
  }
});

test("legacy /ctf URL redirects permanently", async ({ request }) => {
  const res = await request.get("/ctf/pwn-truman", { maxRedirects: 0 });
  expect(res.status()).toBe(308);
  expect(res.headers()["location"]).toContain("/writeups/pwn-truman");
});

test("writeups filter narrows to pwn", async ({ page }) => {
  await page.goto("/writeups");
  await page.getByRole("button", { name: "Pwn", exact: true }).click();
  await expect(page.getByText(/^23 results$/)).toBeVisible();
});

test("contact honeypot is accepted but silent", async ({ request }) => {
  const res = await request.post("/api/contact", { data: { name: "bot", contact: "bot@x", message: "buy cheap stuff now", website: "http://spam" }, headers: { "x-forwarded-for": "203.0.113.9" } });
  expect(res.status()).toBe(201);
});

test("404 page", async ({ page }) => {
  const res = await page.goto("/writeups/nope-nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});

test("footer shows ELANG and contact links", async ({ page }) => {
  await page.goto("/about");
  await page.keyboard.press("End");
  await page.waitForTimeout(1500);
  await expect(page.locator("footer").getByText("ELANG").first()).toBeAttached();
  await expect(page.locator("footer").getByRole("link", { name: /GitHub/ })).toBeVisible();
});
```

- [ ] **Step 3: `e2e/admin.spec.ts`**

```ts
import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test("admin is gated", async ({ page }) => {
  await page.goto("/admin/projects");
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("login, create, edit and delete a project; login is logged", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Username").fill(process.env.ADMIN_USERNAME!);
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  const title = `E2E project ${Date.now()}`;
  await page.goto("/admin/projects/new");
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Tags").fill("e2e, test");
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(page.getByRole("link", { name: title })).toBeVisible();

  await page.goto("/projects");
  await expect(page.getByText(title)).toBeVisible();

  await page.goto("/admin/projects");
  const row = page.locator("li", { hasText: title });
  await row.getByRole("button", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByRole("link", { name: title })).toHaveCount(0);

  await page.goto("/admin/logs");
  await expect(page.locator("td", { hasText: process.env.ADMIN_USERNAME! }).first()).toBeVisible();
});
```

- [ ] **Step 4: Run everything (sandbox disabled)**

```bash
pnpm check
pnpm e2e
```
Expected: lint, typecheck, unit tests and build all pass, and all e2e tests pass in the 3 projects. The admin spec mutates state, so if the `mobile` and `reduced-motion` projects duplicate it, restrict it with `testIgnore` per project: `admin.spec.ts` only in `desktop`.

- [ ] **Step 5: Final visual pass.** Use Playwright MCP to screenshot `/`, `/writeups`, `/writeups/pwn-truman`, `/projects`, `/achievements`, `/about`, and the footer, at 1440×900 and 390×844, in both themes.
  - Check against Global Constraints: no glitch outside the footer, accent used sparingly, Pwn first everywhere.
  - Fix anything off. Then commit:

```bash
git add -A && git commit -m "test: Playwright e2e for public site and admin

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
