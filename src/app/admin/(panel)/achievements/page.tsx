import Link from "next/link";
import { DeleteButton } from "@/components/admin/delete-button";
import { Button } from "@/components/ui/button";
import { deleteAchievement } from "@/lib/admin/actions/achievements";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function AchievementsAdmin() {
  await requireAdmin();
  const rows = await prisma.achievement.findMany({ orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] });
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl font-bold tracking-tight">
          Achievements <span className="meta">{rows.length}</span>
        </h1>
        <Button asChild>
          <Link href="/admin/achievements/new">New achievement</Link>
        </Button>
      </div>
      <ul className="divide-y divide-border border-y border-border">
        {rows.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-4 py-3">
            <Link href={`/admin/achievements/${a.id}`} className="font-medium hover:text-primary">
              {a.title ?? "Untitled"}
            </Link>
            <div className="flex items-center gap-3">
              <span className="meta">{a.date?.toISOString().slice(0, 10) ?? "undated"}</span>
              <DeleteButton action={deleteAchievement.bind(null, a.id)} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
