import { readUpload } from "@/lib/uploads";

export const runtime = "nodejs";

// Uploads are served from our own origin, so a hostile file (e.g. an SVG with <script>) opened
// directly would run with the site's cookies. The CSP sandbox blocks scripts in any served file;
// it does not affect <img> embedding. SVG additionally downloads rather than rendering inline.
const UPLOAD_CSP = "sandbox; default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'";
// Chrome's built-in PDF viewer renders blank under a CSP sandbox. PDF JavaScript runs inside the
// viewer's own sandbox (not this origin), so PDFs get the restrictive policy without `sandbox`.
const PDF_CSP = "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const result = await readUpload(name.trim());
  if ("error" in result) {
    return Response.json({ error: result.error === 400 ? "Invalid asset name." : "File not found." }, { status: result.error });
  }
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "-") || "asset.bin";
  const disposition = result.contentType.startsWith("image/svg") ? "attachment" : "inline";
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.size),
      "Content-Disposition": `${disposition}; filename="${safe}"`,
      "Content-Security-Policy": result.contentType === "application/pdf" ? PDF_CSP : UPLOAD_CSP,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
