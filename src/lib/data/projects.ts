import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { toProject } from "./mappers";

export const listProjects = cache(async () => (await prisma.project.findMany({ orderBy: { createdAt: "desc" } })).map(toProject));
