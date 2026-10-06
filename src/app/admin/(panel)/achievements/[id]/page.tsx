import { notFound } from "next/navigation";
import { AchievementForm } from "@/components/admin/achievement-form";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export default async function EditAchievement({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const a = await prisma.achievement.findUnique({ where: { id: (await params).id } }).catch(() => null);
  if (!a) notFound();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Edit achievement</h1>
      <AchievementForm initial={{ ...a, date: a.date?.toISOString().slice(0, 10) ?? null }} />
    </div>
  );
}
