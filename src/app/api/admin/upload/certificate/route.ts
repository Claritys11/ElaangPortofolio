import { requireAdminApi } from "@/lib/admin/guard";
import { storeCertificate } from "@/lib/certificate-upload";
import { UploadError } from "@/lib/uploads";

export const runtime = "nodejs";

/** Certificate upload: images pass through; PDFs are stored and get a rendered PNG preview. */
export async function POST(req: Request) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });
  if (!/^(image\/|application\/pdf$)/.test(file.type)) return Response.json({ error: "Upload an image or a PDF." }, { status: 415 });
  try {
    return Response.json(await storeCertificate(file), { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return Response.json({ error: e.message }, { status: e.status });
    console.error("certificate upload failed:", e);
    return Response.json({ error: "Could not process this file (is the PDF valid?)" }, { status: 500 });
  }
}
