"use client";

import { FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Certificate image or PDF. A PDF keeps the original (documentUrl) and shows its rendered page 1. */
export function CertificateField({ defaultImage, defaultDocument }: { defaultImage?: string | null; defaultDocument?: string | null }) {
  const [image, setImage] = useState(defaultImage ?? "");
  const [doc, setDoc] = useState(defaultDocument ?? "");
  const [busy, setBusy] = useState(false);
  const embedded = image.startsWith("data:");

  async function upload(file: File) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload/certificate", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      setImage(json.imageUrl);
      setDoc(json.documentUrl ?? "");
      toast.success(json.documentUrl ? "PDF uploaded — preview generated from page 1" : "Image uploaded");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="max-h-48 w-fit rounded border border-border object-contain" />
      )}
      <div className="flex gap-2">
        <Input
          id="imageUrl"
          name={embedded ? undefined : "imageUrl"}
          value={embedded ? "" : image}
          placeholder={embedded ? "(embedded image — upload to replace)" : "/api/public/uploads/… or https://…"}
          onChange={(e) => setImage(e.target.value)}
        />
        {embedded && <input type="hidden" name="imageUrl" value={image} />}
        <Button type="button" variant="secondary" disabled={busy} asChild>
          <label className="cursor-pointer whitespace-nowrap">
            {busy ? "Uploading…" : "Upload image / PDF"}
            <input
              type="file"
              accept="image/*,application/pdf,.pdf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
                e.target.value = "";
              }}
            />
          </label>
        </Button>
      </div>
      {doc && (
        <div className="flex items-center gap-3 text-sm">
          <FileText className="h-4 w-4 text-primary" />
          <a href={doc} target="_blank" rel="noreferrer" className="truncate underline underline-offset-4">
            Original PDF
          </a>
          <Button type="button" variant="ghost" size="sm" onClick={() => setDoc("")}>
            remove PDF
          </Button>
        </div>
      )}
      <input type="hidden" name="documentUrl" value={doc} />
    </div>
  );
}
