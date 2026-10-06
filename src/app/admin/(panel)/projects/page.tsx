import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteProject } from "@/lib/admin/actions/projects";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function ProjectsAdmin() {
  await requireAdmin();
  const rows = await prisma.project.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold tracking-tight">Projects</h1>
        <Button asChild>
          <Link href="/admin/projects/new">New project</Link>
        </Button>
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {rows.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-4 py-3">
            <Link href={`/admin/projects/${p.id}`} className="font-medium hover:text-primary">
              {p.title ?? "Untitled"}
            </Link>
            <div className="flex items-center gap-3">
              <span className="meta">{p.category}</span>
              <DeleteButton action={deleteProject.bind(null, p.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
