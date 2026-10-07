import { Download, FileText, Paperclip, Printer } from "lucide-react";
import type { Attachment } from "@/lib/types";

const pill = "inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors hover:border-foreground hover:text-foreground text-muted-foreground";

export function WriteupExport({ href, attachments }: { href: string; attachments: Attachment[] }) {
  return (
    <section id="attachments" className="mt-16 scroll-mt-24 border-t border-border pt-8" aria-label="Export and files">
      <p className="meta mb-4">export &amp; files</p>
      <div className="flex flex-wrap gap-2">
        <a className={pill} href={`${href}/print`} target="_blank" rel="noopener">
          <Printer className="h-3.5 w-3.5" /> PDF
        </a>
        <a className={pill} href={`${href}/export?format=html`} download>
          <Download className="h-3.5 w-3.5" /> HTML
        </a>
        <a className={pill} href={`${href}/export?format=md`} download>
          <FileText className="h-3.5 w-3.5" /> Markdown
        </a>
        {attachments.map((a) => (
          <a key={a.url} className={pill} href={a.url} download>
            <Paperclip className="h-3.5 w-3.5" /> {a.name.replace(/^[0-9a-f-]{36}-/, "")}
          </a>
        ))}
      </div>
    </section>
  );
}
