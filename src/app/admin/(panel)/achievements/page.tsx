import Link from "next/link";
import { AchievementOrderList } from "@/components/admin/achievement-order-list";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";
import { normalizeMediaUrl } from "@/lib/json";

export default async function AchievementsAdmin() {
  await requireAdmin();
  // Same order as the public /achievements page.
  const rows = await prisma.achievement.findMany({
    orderBy: [{ sortOrder: { sort: "asc", nulls: "last" } }, { date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    select: { id: true, title: true, date: true, imageUrl: true, sortOrder: true },
  });
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
      <AchievementOrderList
        key={rows.map((r) => `${r.id}:${r.sortOrder}`).join()}
        hasCustomOrder={rows.some((r) => r.sortOrder !== null)}
        initial={rows.map((r) => ({ id: r.id, title: r.title ?? "Untitled", date: r.date?.toISOString().slice(0, 10) ?? "undated", imageUrl: normalizeMediaUrl(r.imageUrl) }))}
      />
    </div>
  );
}
