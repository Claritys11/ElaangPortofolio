import { notFound } from "next/navigation";
import { ProjectForm } from "@/components/admin/project-form";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { parseStringArray } from "@/lib/json";

export default async function EditProject({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const p = await prisma.project.findUnique({ where: { id: (await params).id } }).catch(() => null);
  if (!p) notFound();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Edit project</h1>
      <ProjectForm initial={{ ...p, tags: parseStringArray(p.tagsJson) }} />
    </div>
  );
}
