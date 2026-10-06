import { notFound } from "next/navigation";
import { WriteupForm } from "@/components/admin/writeup-form";
import { requireAdmin } from "@/lib/admin/guard";
import { listWriteups } from "@/lib/data/writeups";
import { buildTagIndex } from "@/lib/tags";
import { toWriteupDetail } from "@/lib/data/mappers";
import { prisma } from "@/lib/db";
import { normalizeLegacyHtml } from "@/lib/html";

export default async function EditWriteup({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const row = await prisma.writeup.findUnique({ where: { id: (await params).id } }).catch(() => null);
  if (!row) notFound();
  const d = toWriteupDetail(row);
  const content = await normalizeLegacyHtml(row.content ?? "");
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-4xl font-bold tracking-tight">Edit writeup</h1>
      <WriteupForm
        tagIndex={buildTagIndex(await listWriteups())}
        initial={{
          id: row.id,
          title: row.title,
          slug: row.slug,
          competition: row.competition,
          category: row.category,
          difficulty: row.difficulty,
          date: row.date?.toISOString().slice(0, 10) ?? null,
          summary: row.summary,
          content,
          flag: row.flag,
          tags: d.tags,
          attachments: d.attachments,
        }}
      />
    </div>
  );
}
