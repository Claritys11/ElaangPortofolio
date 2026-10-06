import { ProjectForm } from "@/components/admin/project-form";
import { requireAdmin } from "@/lib/admin/guard";

export default async function NewProject() {
  await requireAdmin();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">New project</h1>
      <ProjectForm />
    </div>
  );
}
