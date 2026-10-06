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
              for (const f of files) await uploadFile(f).catch((err: Error) => toast.error(`${f.name}: ${err.message}`));
              setBusy(false);
              router.refresh();
            }}
          />
        </label>
      </Button>
      <ul className="divide-y divide-border border-y border-border">
        {items.map((i) => (
          <li key={i.name} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 py-2 text-sm">
            <a href={i.url} target="_blank" rel="noreferrer" className="truncate font-mono text-xs hover:text-primary">
              {i.name}
            </a>
            <span className="meta">{(i.size / 1024).toFixed(0)} KB</span>
            <Button size="sm" variant="ghost" type="button" onClick={() => navigator.clipboard.writeText(i.url).then(() => toast.success("URL copied"))}>
              Copy URL
            </Button>
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
