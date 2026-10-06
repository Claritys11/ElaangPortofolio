"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/guard";
import { prisma } from "@/lib/db";

export async function deleteMessage(id: string) {
  await requireAdmin();
  await prisma.secureMessage.delete({ where: { id } });
  revalidatePath("/admin/messages");
}

export async function deleteMessages(fd: FormData) {
  await requireAdmin();
  const ids = fd.getAll("ids").filter((v): v is string => typeof v === "string");
  if (ids.length) await prisma.secureMessage.deleteMany({ where: { id: { in: ids } } });
  revalidatePath("/admin/messages");
}
