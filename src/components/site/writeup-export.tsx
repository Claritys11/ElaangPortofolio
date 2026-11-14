"use client";

import { Download, FileText, Paperclip, Printer } from "lucide-react";
import type { Attachment } from "@/lib/types";
import { withBasePath } from "@/lib/base-path";

const pill = "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors hover:border-foreground hover:text-foreground text-muted-foreground print:hidden";

export function WriteupExport({
  slug,
  attachments,
}: {
  slug: string;
  attachments: Attachment[];
}) {
  const base = withBasePath("/assets/exports/" + encodeURIComponent(slug)) ?? "/assets/exports/" + encodeURIComponent(slug);
  return (
    <section id="attachments" className="mt-16 scroll-mt-24 border-t border-border pt-8 print:hidden" aria-label="Export and files">
      <p className="meta mb-4">export &amp; files</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={pill} onClick={() => window.print()}>
          <Printer className="h-3.5 w-3.5" /> PDF
        </button>
        <a className={pill} href={base + ".html"} download>
          <Download className="h-3.5 w-3.5" /> HTML
        </a>
        <a className={pill} href={base + ".md"} download>
          <FileText className="h-3.5 w-3.5" /> Markdown
        </a>
        {attachments.map((attachment) => (
          <a key={attachment.url} className={pill} href={withBasePath(attachment.url) ?? attachment.url} download>
            <Paperclip className="h-3.5 w-3.5" /> {attachment.name.replace(/^[0-9a-f-]{36}-/, "")}
          </a>
        ))}
      </div>
    </section>
  );
}
