import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { listWriteups } from "@/lib/data/writeups";
import { BIO_LINKS, type BioLink } from "@/lib/links";
import { pageOpenGraph } from "@/lib/seo";
import type { WriteupSummary } from "@/lib/types";

// Lives outside the (site) group on purpose: most visits come from Instagram's in-app browser,
// so this page skips the nav, smooth scroll and footer animation and ships almost no JS.
export const dynamic = "force-dynamic";

const description = "Links from Elang (Claritys): the latest CTF writeup, projects, GitHub, Instagram and contact.";

export const metadata: Metadata = {
  // absolute: the root layout's "%s — Claritys" template would otherwise wrap it again.
  title: { absolute: "Elang | Claritys — Links" },
  description,
  alternates: { canonical: "/links" },
  openGraph: pageOpenGraph("/links", { title: "Elang | Claritys — Links", description }),
  twitter: { card: "summary_large_image" },
};

/** A failed or empty fetch only hides the latest-writeup card; the rest of the page still renders. */
async function latestWriteup(): Promise<WriteupSummary | null> {
  try {
    return (await listWriteups())[0] ?? null;
  } catch (err) {
    console.error("[links] latest writeup unavailable", err);
    return null;
  }
}

const hex = (n: number) => `0x${n.toString(16).padStart(2, "0")}`;

function LinkCard({ index, link }: { index: number; link: BioLink }) {
  const body = (
    <>
      <span className="font-mono text-[11px] tracking-[0.14em] text-primary">{hex(index)}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-lg leading-tight font-semibold tracking-tight">{link.label}</span>
        <span className="meta block truncate">{link.hint}</span>
      </span>
      <span aria-hidden className="font-mono text-muted-foreground transition-colors group-hover:text-primary">
        {link.external ? "↗" : "→"}
      </span>
    </>
  );
  const className =
    "group flex min-h-14 w-full items-center gap-4 border border-border px-4 py-3 transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none";
  return link.external ? (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
      {body}
    </a>
  ) : (
    <Link href={link.href} className={className}>
      {body}
    </Link>
  );
}

export default async function LinksPage() {
  const latest = await latestWriteup();
  const links: BioLink[] = [
    ...(latest ? [{ label: latest.title, href: latest.href, hint: `latest writeup · ${latest.category}` }] : []),
    ...BIO_LINKS,
  ];

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col px-4 pt-6 pb-10">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <p className="meta pt-1">
            aka <span className="text-foreground">claritys</span>
          </p>
          <ThemeToggle className="-mt-3 -mr-3 inline-flex min-h-11 min-w-11 items-center justify-center px-3" />
        </div>
        <h1 className="mt-2 font-display text-7xl leading-[0.8] font-black tracking-[-0.05em]">ELANG</h1>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3">
          <p className="font-mono text-xs tracking-[0.2em]">pwn · rev · web exploit</p>
          <p className="meta flex items-center gap-2 text-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-primary" />
            open to CTF teams
          </p>
        </div>
      </header>

      <nav aria-label="Links">
        <ul className="grid gap-2">
          {links.map((link, i) => (
            <li key={link.href}>
              <LinkCard index={i + 1} link={link} />
            </li>
          ))}
        </ul>
      </nav>

      <p className="meta mt-auto pt-10 text-center">© {new Date().getFullYear()} Elang Dimas Syadewa</p>
    </main>
  );
}
