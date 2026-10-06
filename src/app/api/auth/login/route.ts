import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request";
import { checkCredentials, COOKIE_NAME, createSessionToken, SESSION_TTL_MS } from "@/lib/session";

export const runtime = "nodejs";
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
const Body = z.object({ username: z.string().max(200), password: z.string().max(500) });

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const gate = limiter.hit(ip);
  if (!gate.ok) return Response.json({ error: "Too many attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(gate.retryAfter) } });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Bad request." }, { status: 400 });

  const { username, password } = parsed.data;
  const ok = checkCredentials(username, password);
  await prisma.accessLog
    .create({ data: { username: username || "(unknown)", accessedAt: new Date(), accessSuccessful: ok, ip } })
    .catch(() => undefined);

  if (!ok) return Response.json({ error: "Invalid credentials." }, { status: 401 });

  (await cookies()).set(COOKIE_NAME, createSessionToken(username), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return Response.json({ ok: true });
}
