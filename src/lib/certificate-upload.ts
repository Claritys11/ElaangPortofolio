import path from "node:path";
import { renderPdfPreview } from "@/lib/pdf-preview";
import { writeUpload, writeUploadBuffer } from "@/lib/uploads";

/**
 * Certificates may be images or PDFs. A PDF is kept as the original document and its first page is
 * rendered to a PNG preview, so the timeline/gallery can show it like any other certificate.
 */
export async function storeCertificate(file: File): Promise<{ imageUrl: string; documentUrl: string | null }> {
  const saved = await writeUpload(file);
  if (saved.contentType !== "application/pdf") return { imageUrl: saved.url, documentUrl: null };
  const png = await renderPdfPreview(Buffer.from(await file.arrayBuffer()));
  const base = path.basename(file.name, path.extname(file.name));
  const preview = await writeUploadBuffer(`${base}-preview.png`, png);
  return { imageUrl: preview.url, documentUrl: saved.url };
}
