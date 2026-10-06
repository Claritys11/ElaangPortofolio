import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteWriteup } from "@/lib/admin/actions/writeups";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function WriteupsAdmin() {
  await requireAdmin();
  const rows = await prisma.writeup.findMany({
    orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: { id: true, title: true, slug: true, category: true, competition: true, date: true },
  });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Writeups <span className="meta">{rows.length}</span>
        </h1>
        <Button asChild>
          <Link href="/admin/writeups/new">New writeup</Link>
        </Button>
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {rows.map((w) => (
          <li key={w.id} className="grid grid-cols-[1fr_auto] items-center gap-4 py-3 md:grid-cols-[1fr_8rem_12rem_7rem_auto]">
            <Link href={`/admin/writeups/${w.id}`} className="font-medium hover:text-primary">
              {w.title ?? "Untitled"}
            </Link>
            <span className="meta hidden md:block">{w.category}</span>
            <span className="meta hidden md:block">{w.competition}</span>
            <span className="meta hidden md:block">{w.date?.toISOString().slice(0, 10) ?? "undated"}</span>
            <div className="flex items-center gap-2">
              <a href={`/writeups/${w.slug ?? w.id}`} target="_blank" rel="noreferrer" className="meta hover:text-foreground">
                view
              </a>
              <DeleteButton action={deleteWriteup.bind(null, w.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
