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
      (w) => (cat === "All" || w.category === cat) && (!needle || [w.title, w.competition, w.summary, ...w.tags].join(" ").toLowerCase().includes(needle)),
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
              className={cn(
                "rounded-full border px-4 py-1.5 font-mono text-xs tracking-wider uppercase transition-colors",
                cat === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground",
              )}
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
