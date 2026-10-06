"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { AchievementSchema } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";

export async function saveAchievement(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = AchievementSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { id, ...data } = parsed.data;
  if (id) await prisma.achievement.update({ where: { id }, data });
  else await prisma.achievement.create({ data });
  revalidatePath("/admin/achievements");
  redirect("/admin/achievements");
}

export async function deleteAchievement(id: string) {
  await requireAdmin();
  await prisma.achievement.delete({ where: { id } });
  revalidatePath("/admin/achievements");
}
