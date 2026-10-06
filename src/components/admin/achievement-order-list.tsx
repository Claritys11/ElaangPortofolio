"use client";

import { Reorder, useDragControls } from "framer-motion";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteAchievement, resetAchievementOrder, saveAchievementOrder } from "@/lib/admin/actions/achievements";

type Row = { id: string; title: string; date: string; imageUrl: string | null };

function Item({ row, index }: { row: Row; index: number }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={row} dragListener={false} dragControls={controls} className="flex items-center gap-3 border-b border-border bg-background py-2.5">
      <button
        type="button"
        aria-label={`Drag to reorder ${row.title}`}
        onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-secondary hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-6 text-right font-mono text-xs text-muted-foreground">{index + 1}</span>
      {row.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.imageUrl} alt="" className="h-9 w-12 rounded-sm border border-border object-cover" draggable={false} />
      ) : (
        <span className="h-9 w-12 rounded-sm bg-muted" />
      )}
      <Link href={`/admin/achievements/${row.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-primary">
        {row.title}
      </Link>
      <span className="meta hidden sm:inline">{row.date}</span>
      <DeleteButton action={deleteAchievement.bind(null, row.id)} />
    </Reorder.Item>
  );
}

export function AchievementOrderList({ initial, hasCustomOrder }: { initial: Row[]; hasCustomOrder: boolean }) {
  const [rows, setRows] = useState(initial);
  const [saved, setSaved] = useState(initial.map((r) => r.id).join());
  const [pending, start] = useTransition();
  const dirty = rows.map((r) => r.id).join() !== saved;

  const save = () =>
    start(async () => {
      const fd = new FormData();
      fd.append("ids", JSON.stringify(rows.map((r) => r.id)));
      const res = await saveAchievementOrder(fd);
      if (res.ok) {
        setSaved(rows.map((r) => r.id).join());
        toast.success("Order saved — /achievements updated");
      } else toast.error(res.message ?? "Save failed");
    });

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted-foreground">Drag the handle to set the order on /achievements.</p>
        <div className="ml-auto flex gap-2">
          {hasCustomOrder && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  await resetAchievementOrder();
                  toast.success("Back to newest-first");
                })
              }
            >
              Reset to date order
            </Button>
          )}
          <Button type="button" size="sm" onClick={save} disabled={!dirty || pending}>
            {pending ? "Saving…" : dirty ? "Save order" : "Saved"}
          </Button>
        </div>
      </div>
      <Reorder.Group axis="y" values={rows} onReorder={setRows} className="border-t border-border">
        {rows.map((r, i) => (
          <Item key={r.id} row={r} index={i} />
        ))}
      </Reorder.Group>
    </div>
  );
}
