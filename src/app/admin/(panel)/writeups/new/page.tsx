import { WriteupForm } from "@/components/admin/writeup-form";
import { requireAdmin } from "@/lib/admin/guard";

export default async function NewWriteup() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">New writeup</h1>
      <WriteupForm />
    </div>
  );
}
