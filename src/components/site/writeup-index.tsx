"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { HoverPreview } from "@/components/site/hover-preview";
import { formatDate } from "@/lib/format";
import type { WriteupSummary } from "@/lib/types";

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
              <span className="font-display text-2xl font-semibold tracking-tight transition-transform duration-500 group-hover:translate-x-2 group-hover:text-primary md:text-4xl">
                {w.title}
              </span>
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
