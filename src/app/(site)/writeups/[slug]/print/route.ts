import { getWriteup } from "@/lib/data/writeups";
import { renderWriteupHtml } from "@/lib/html";
import { siteUrl } from "@/lib/site";
import { buildPrintHtml } from "@/lib/writeup-export";

export const runtime = "nodejs";

/** Paged, print-only version of a writeup that opens the print dialog → "Save as PDF". */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const w = await getWriteup((await params).slug);
  if (!w) return new Response("Not found", { status: 404 });
  const { html, toc } = await renderWriteupHtml(w.content, { altPrefix: w.title });
  const doc = buildPrintHtml(w, html, toc, siteUrl());
  return new Response(doc, { headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
}
