import { z } from "zod";
import { ContactSchema, formatContactMessage } from "@/lib/contact";
import { prisma } from "@/lib/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";

export const runtime = "nodejs";
const limiter = createRateLimiter({ limit: 3, windowMs: 10 * 60 * 1000 });

export async function POST(req: Request) {
  const body = await req.json().catch(() => undefined);
  if (body === undefined) return Response.json({ error: "Bad request." }, { status: 400 });

  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Check the highlighted fields.", fields: z.flattenError(parsed.error).fieldErrors }, { status: 422 });
  if (parsed.data.website) return Response.json({ ok: true }, { status: 201 });

  const gate = limiter.hit(clientIp(req.headers));
  if (!gate.ok) return Response.json({ error: "Too many messages. Try again later." }, { status: 429, headers: { "Retry-After": String(gate.retryAfter) } });

  await prisma.secureMessage.create({ data: formatContactMessage(parsed.data) });
  return Response.json({ ok: true }, { status: 201 });
}
