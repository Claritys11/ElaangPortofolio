import { getWriteup } from "@/lib/data/writeups";
import { inlineUpload } from "@/lib/export-assets";
import { normalizeLegacyHtml, renderWriteupHtml } from "@/lib/html";
import { siteUrl } from "@/lib/site";
import { buildExportHtml, toMarkdown } from "@/lib/writeup-export";

export const runtime = "nodejs";

/** GET /writeups/<slug>/export?format=md|html — downloadable copies of a writeup. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const w = await getWriteup((await params).slug);
  if (!w) return new Response("Not found", { status: 404 });
  const format = new URL(req.url).searchParams.get("format") === "md" ? "md" : "html";
  const name = (w.slug || w.id).replace(/[^a-z0-9-]/gi, "-");
  const headers = { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" };
  if (format === "md") {
    const md = toMarkdown(w, await normalizeLegacyHtml(w.content), siteUrl());
    return new Response(md, { headers: { ...headers, "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.md"` } });
  }
  const { html } = await renderWriteupHtml(w.content, { altPrefix: w.title });
  const doc = await buildExportHtml(w, html, inlineUpload, siteUrl());
  return new Response(doc, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.html"` } });
}
