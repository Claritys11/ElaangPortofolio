import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { toAchievement } from "./mappers";

export const listAchievements = cache(async () =>
  (await prisma.achievement.findMany({ orderBy: [{ sortOrder: { sort: "asc", nulls: "last" } }, { date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] })).map(toAchievement),
);
