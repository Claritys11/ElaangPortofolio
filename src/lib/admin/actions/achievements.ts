"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { AchievementSchema, OrderSchema, sortOrderForNew } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";

export async function saveAchievement(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = AchievementSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { id, ...data } = parsed.data;
  if (id) await prisma.achievement.update({ where: { id }, data });
  else {
    const { _min } = await prisma.achievement.aggregate({ _min: { sortOrder: true } });
    await prisma.achievement.create({ data: { ...data, sortOrder: sortOrderForNew(_min.sortOrder) } });
  }
  revalidatePath("/admin/achievements");
  redirect("/admin/achievements");
}

export async function deleteAchievement(id: string) {
  await requireAdmin();
  await prisma.achievement.delete({ where: { id } });
  revalidatePath("/admin/achievements");
}

export async function saveAchievementOrder(fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = OrderSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Invalid order." };
  const { ids } = parsed.data;
  await prisma.$transaction(ids.map((id, i) => prisma.achievement.update({ where: { id }, data: { sortOrder: i } })));
  revalidatePath("/admin/achievements");
  return { ok: true, message: "Order saved" };
}

export async function resetAchievementOrder() {
  await requireAdmin();
  await prisma.achievement.updateMany({ data: { sortOrder: null } });
  revalidatePath("/admin/achievements");
}
