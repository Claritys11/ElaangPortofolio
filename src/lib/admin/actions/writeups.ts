"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { WriteupSchema } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";
import { defaultWriteupSlug } from "@/lib/slug";

export async function saveWriteup(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = WriteupSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { id, tags, attachments, slug, ...rest } = parsed.data;
  const finalSlug = slug ?? (defaultWriteupSlug(rest.category, rest.title) || null);
  if (finalSlug) {
    const clash = await prisma.writeup.findFirst({ where: { slug: finalSlug, NOT: id ? { id } : undefined }, select: { id: true } });
    if (clash) return { ok: false, message: "Slug already used.", fields: { slug: [`"${finalSlug}" is taken by another writeup`] } };
  }
  const data = { ...rest, slug: finalSlug, tagsJson: tags, attachmentsJson: attachments };
  if (id) await prisma.writeup.update({ where: { id }, data });
  else await prisma.writeup.create({ data });
  revalidatePath("/admin/writeups");
  redirect("/admin/writeups");
}

export async function deleteWriteup(id: string) {
  await requireAdmin();
  await prisma.writeup.delete({ where: { id } });
  revalidatePath("/admin/writeups");
}
