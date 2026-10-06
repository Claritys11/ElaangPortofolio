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
          <button
            key={k}
            type="button"
            aria-pressed={kind === k}
            onClick={() => setKind(k)}
            className={cn(
              "rounded-full border px-4 py-1.5 font-mono text-xs tracking-wider uppercase",
              kind === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground",
            )}
          >
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
        <DialogContent className="max-w-4xl sm:max-w-4xl">
          <DialogTitle className="font-display">{open?.title}</DialogTitle>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {open?.imageUrl && <img src={open.imageUrl} alt={open.title} className="max-h-[75vh] w-full object-contain" />}
        </DialogContent>
      </Dialog>
    </>
  );
}
