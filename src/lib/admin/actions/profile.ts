"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { type ActionState, formToObject } from "@/lib/admin/form";
import { requireAdmin } from "@/lib/admin/guard";
import { ProfileSchema } from "@/lib/admin/schemas";
import { prisma } from "@/lib/db";

export async function saveProfile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = ProfileSchema.safeParse(formToObject(fd));
  if (!parsed.success) return { ok: false, message: "Fix the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors };
  const { technicalArsenal, professionalJourney, educationHistory, seo, ...scalars } = parsed.data;
  const data = {
    ...scalars,
    technicalArsenalJson: technicalArsenal,
    professionalJourneyJson: professionalJourney,
    educationHistoryJson: educationHistory,
    // Loose object (legacy keys preserved) — structurally JSON, typed loosely by zod.
    seoSettingsJson: seo as Prisma.InputJsonValue,
  };
  await prisma.profileSettings.upsert({ where: { id: "main" }, create: { id: "main", ...data }, update: data });
  revalidatePath("/admin/profile");
  return { ok: true, message: "Saved" };
}
