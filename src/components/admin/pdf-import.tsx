"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export type ImportedDoc = { title: string; summary: string; content: string; competition?: string; category?: string; difficulty?: string; date?: string; tags?: string[]; assetCount?: number; pageCount?: number };

export function PdfImport({ onImported }: { onImported: (d: ImportedDoc) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button type="button" variant="outline" disabled={busy} asChild>
      <label className="cursor-pointer">
        {busy ? "Importing…" : "Import PDF / Notion ZIP"}
        <input
          type="file"
          accept=".pdf,.zip,application/pdf,application/zip"
          className="sr-only"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            const fd = new FormData();
            fd.append("file", f);
            const res = await fetch("/api/admin/writeups/import-pdf", { method: "POST", body: fd }).catch(() => null);
            const json = await res?.json().catch(() => null);
            setBusy(false);
            if (!res?.ok) {
              toast.error(json?.error ?? "Import failed");
              return;
            }
            onImported(json);
            const extras = [json.pageCount && `${json.pageCount} pages`, json.assetCount && `${json.assetCount} images`].filter(Boolean).join(", ");
            toast.success(`Imported${extras ? ` (${extras})` : ""} — review before saving`);
          }}
        />
      </label>
    </Button>
  );
}
