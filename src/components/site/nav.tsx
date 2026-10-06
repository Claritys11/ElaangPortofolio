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
    <header className="fixed inset-x-0 top-0 z-50 text-white mix-blend-difference">
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
