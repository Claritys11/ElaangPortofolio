"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export async function uploadFile(file: File): Promise<{ url: string; name: string; contentType: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Upload failed");
  return json;
}

export function ImageField({ name, defaultValue }: { name: string; defaultValue?: string | null }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const embedded = value.startsWith("data:");
  return (
    <div className="grid gap-3">
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="max-h-48 w-fit rounded border border-border object-contain" />
      )}
      <div className="flex gap-2">
        <Input
          id={name}
          name={embedded ? undefined : name}
          value={embedded ? "" : value}
          placeholder={embedded ? "(embedded image — upload or paste a URL to replace)" : "/api/public/uploads/… or https://…"}
          onChange={(e) => setValue(e.target.value)}
        />
        {/* Legacy data: images travel in a hidden field so a save without changes keeps them. */}
        {embedded && <input type="hidden" name={name} value={value} />}
        <Button type="button" variant="secondary" disabled={busy} asChild>
          <label className="cursor-pointer">
            {busy ? "Uploading…" : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setBusy(true);
                try {
                  setValue((await uploadFile(f)).url);
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
        </Button>
      </div>
    </div>
  );
}
