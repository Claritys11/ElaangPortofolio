"use client";

import { useMemo, useState } from "react";
import { RecordTimeline } from "@/components/site/record-timeline";
import InteractiveBentoGallery from "@/components/ui/interactive-bento-gallery";
import { toMediaItems } from "@/lib/bento";
import type { AchievementItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const isCompetition = (a: AchievementItem) => /ctf|competition|rank|top \d|finalist|medal/i.test(`${a.title} ${a.platform ?? ""}`);

export function AchievementList({ items }: { items: AchievementItem[] }) {
  const [kind, setKind] = useState<"all" | "competitions" | "learning">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered = useMemo(() => items.filter((a) => kind === "all" || (kind === "competitions") === isCompetition(a)), [items, kind]);
  // The gallery always holds every certificate, so a timeline click works under any filter.
  const media = useMemo(() => toMediaItems(items), [items]);
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
      <RecordTimeline items={filtered} onOpen={setOpenId} />
      {media.length > 0 && (
        <section className="mt-32">
          <InteractiveBentoGallery
            mediaItems={media}
            title="Certificates"
            description={`${media.length} proofs · click to view · drag to rearrange`}
            selectedId={openId}
            onSelectedIdChange={setOpenId}
          />
        </section>
      )}
    </>
  );
}
