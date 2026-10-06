"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { ProjectSchema } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";

export async function saveProject(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = ProjectSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { id, tags, ...rest } = parsed.data;
  const data = { ...rest, tagsJson: tags };
  if (id) await prisma.project.update({ where: { id }, data });
  else await prisma.project.create({ data });
  revalidatePath("/admin/projects");
  redirect("/admin/projects");
}

export async function deleteProject(id: string) {
  await requireAdmin();
  await prisma.project.delete({ where: { id } });
  revalidatePath("/admin/projects");
}
