import { readUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const result = await readUpload(name.trim());
  if ("error" in result) {
    return Response.json({ error: result.error === 400 ? "Invalid asset name." : "File not found." }, { status: result.error });
  }
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "-") || "asset.bin";
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.contentType,
      "Content-Length": String(result.size),
      "Content-Disposition": `inline; filename="${safe}"`,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
