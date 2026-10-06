import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { toAchievement } from "./mappers";

export const listAchievements = cache(async () =>
  (await prisma.achievement.findMany({ orderBy: [{ date: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }] })).map(toAchievement),
);
