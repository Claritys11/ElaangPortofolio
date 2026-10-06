import { requireAdminApi } from "@/lib/admin/guard";
import { UploadError, writeUpload } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) return Response.json({ error: "file is required" }, { status: 400 });
  try {
    return Response.json(await writeUpload(file), { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return Response.json({ error: e.message }, { status: e.status });
    console.error("upload failed:", e);
    const code = (e as NodeJS.ErrnoException)?.code;
    return Response.json({ error: code === "EACCES" || code === "EROFS" ? "Upload folder is not writable on the server" : "Upload failed" }, { status: 500 });
  }
}
