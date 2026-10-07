import { getWriteup } from "@/lib/data/writeups";
import { renderWriteupHtml } from "@/lib/html";
import { siteUrl } from "@/lib/site";
import { buildExportHtml } from "@/lib/writeup-export";

export const runtime = "nodejs";

/** Print-optimised page (light, code wraps, no page breaks inside code/images) that opens the print dialog → "Save as PDF". */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const w = await getWriteup((await params).slug);
  if (!w) return new Response("Not found", { status: 404 });
  const { html } = await renderWriteupHtml(w.content, { altPrefix: w.title });
  const doc = (await buildExportHtml(w, html, async () => null, siteUrl())).replace(
    "</body>",
    `<script>addEventListener("load",function(){Promise.all([...document.images].map(function(i){return i.complete?0:new Promise(function(r){i.onload=i.onerror=r})})).then(function(){setTimeout(function(){print()},300)})})</script>\n</body>`,
  );
  return new Response(doc, { headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
}
