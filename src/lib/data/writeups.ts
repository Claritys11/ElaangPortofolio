import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import type { WriteupSummary } from "@/lib/types";
import { toWriteupDetail, toWriteupSummary } from "./mappers";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const listWriteups = cache(async () => {
  const rows = await prisma.writeup.findMany({ orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] });
  return rows.map(toWriteupSummary);
});

export const getWriteup = cache(async (slugOrId: string) => {
  const key = decodeURIComponent(slugOrId);
  const row =
    (await prisma.writeup.findFirst({ where: { slug: key } })) ??
    (UUID.test(key) ? await prisma.writeup.findUnique({ where: { id: key } }) : null);
  return row ? toWriteupDetail(row) : null;
});

export async function getAdjacentWriteups(w: WriteupSummary) {
  const same = (await listWriteups()).filter((x) => x.category === w.category);
  const i = same.findIndex((x) => x.id === w.id);
  return { prev: i > 0 ? same[i - 1] : null, next: i >= 0 && i < same.length - 1 ? same[i + 1] : null };
}

export const getCategoryStats = cache(async () => {
  const counts = new Map<string, number>();
  for (const w of await listWriteups()) counts.set(w.category, (counts.get(w.category) ?? 0) + 1);
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => Number(b.category === "Pwn") - Number(a.category === "Pwn") || b.count - a.count);
});

export const getCompetitions = cache(async () => {
  const counts = new Map<string, number>();
  for (const w of await listWriteups()) if (w.competition) counts.set(w.competition, (counts.get(w.competition) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
});
