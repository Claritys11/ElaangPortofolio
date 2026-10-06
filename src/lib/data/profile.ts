import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { toProfile } from "./mappers";

export const getProfile = cache(async () => toProfile(await prisma.profileSettings.findUnique({ where: { id: "main" } })));
