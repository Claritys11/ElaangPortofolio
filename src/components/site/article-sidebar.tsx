"use client";

import { useEffect, useState } from "react";
import { getLenis } from "@/components/motion/smooth-scroll";
import type { TocItem } from "@/lib/html";
import { cn } from "@/lib/utils";

type Info = { category: string; difficulty: string | null; competition: string; date: string; minutes: number; hasAttachments: boolean; hasFlag: boolean };

function jump(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const lenis = getLenis();
  if (!lenis) return;
  e.preventDefault();
  lenis.scrollTo(`#${CSS.escape(id)}`, { offset: -96 });
  history.replaceState(null, "", `#${id}`);
}

function useActiveHeading(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (!ids.length) return;
    const visible = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.add(e.target.id);
          else visible.delete(e.target.id);
        }
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      { rootMargin: "-96px 0px -60% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [ids]);
  return active;
}

export function ArticleSidebar({ info, toc }: { info: Info; toc: TocItem[] }) {
  const active = useActiveHeading(toc.map((t) => t.id));
  const minDepth = Math.min(...toc.map((t) => t.depth), 4);
  const rows: [string, string][] = [
    ["category", info.category],
    ...(info.difficulty ? ([["difficulty", info.difficulty]] as [string, string][]) : []),
    ...(info.competition ? ([["ctf", info.competition]] as [string, string][]) : []),
    ["date", info.date],
    ["read", `${info.minutes} min`],
  ];
  return (
    <aside className="sticky top-24 hidden max-h-[calc(100svh-7rem)] flex-col gap-10 overflow-y-auto pb-8 lg:flex" aria-label="Writeup details">
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-y border-border py-5">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="meta">{k}</dt>
            <dd className={cn("text-right text-sm", k === "category" && "text-primary")}>{v}</dd>
          </div>
        ))}
        <div className="col-span-2 mt-3 flex gap-4">
          <a href="#attachments" className="meta border-b border-border pb-0.5 hover:text-foreground">
            {info.hasAttachments ? "files & export ↓" : "export ↓"}
          </a>
          {info.hasFlag && (
            <a href="#flag" className="meta border-b border-border pb-0.5 hover:text-foreground">
              flag ↓
            </a>
          )}
        </div>
      </dl>
      {toc.length > 1 && (
        <nav aria-label="On this page">
          <p className="meta mb-4">on this page</p>
          <ol className="grid gap-2 border-l border-border text-sm">
            {toc.map((t) => (
              <li key={t.id} style={{ paddingLeft: `${0.875 + (t.depth - minDepth) * 0.875}rem` }} className="relative">
                {active === t.id && <span aria-hidden className="absolute top-0 bottom-0 -left-px w-px bg-primary" />}
                <a
                  href={`#${t.id}`}
                  onClick={(e) => jump(e, t.id)}
                  aria-current={active === t.id ? "location" : undefined}
                  className={cn("block transition-colors hover:text-foreground", active === t.id ? "text-foreground" : "text-muted-foreground")}
                >
                  {t.text}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      )}
    </aside>
  );
}
