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
                lenis.scrollTo(`#${CSS.escape(t.id)}`, { offset: -96 });
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
