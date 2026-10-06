import { requireAdminApi } from "@/lib/admin/guard";
import { deleteUpload } from "@/lib/uploads";

export async function DELETE(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await requireAdminApi())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const status = await deleteUpload((await params).name);
  return Response.json(status === 200 ? { ok: true } : { error: status === 400 ? "Invalid name" : "Not found" }, { status });
}
