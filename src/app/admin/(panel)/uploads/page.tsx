import { UploadManager } from "@/components/admin/upload-manager";
import { requireAdmin } from "@/lib/admin/guard";
import { listUploads } from "@/lib/uploads";

export default async function UploadsPage() {
  await requireAdmin();
  const items = await listUploads();
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-4xl font-bold tracking-tight">
        Uploads <span className="meta">{items.length}</span>
      </h1>
      <UploadManager items={items} />
    </div>
  );
}
