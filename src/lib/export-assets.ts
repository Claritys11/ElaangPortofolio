import { readUpload } from "@/lib/uploads";

/** Inline a site-relative upload as a data: URL (for offline HTML exports). Other URLs are left alone. */
export async function inlineUpload(src: string): Promise<string | null> {
  const m = /^\/api\/public\/uploads\/([^?#]+)/.exec(src);
  if (!m) return null;
  const file = await readUpload(decodeURIComponent(m[1]));
  if ("error" in file) return null;
  const buf = Buffer.from(await new Response(file.stream).arrayBuffer());
  return `data:${file.contentType.split(";")[0]};base64,${buf.toString("base64")}`;
}
