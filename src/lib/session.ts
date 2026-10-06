import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_NAME = "admin_session";
export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;

type Payload = { username: string; exp: number };

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("ADMIN_SESSION_SECRET must be set and at least 32 characters long.");
  return s;
}

const mac = (data: string) => createHmac("sha256", secret()).update(data).digest("base64url");

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function createSessionToken(username: string, now = Date.now()): string {
  const encoded = Buffer.from(JSON.stringify({ username, exp: now + SESSION_TTL_MS } satisfies Payload)).toString("base64url");
  return `${encoded}.${mac(encoded)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): Payload | null {
  if (!token) return null;
  try {
    const dot = token.lastIndexOf(".");
    if (dot < 1) return null;
    const encoded = token.slice(0, dot);
    if (!safeEqual(token.slice(dot + 1), mac(encoded))) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as Payload;
    if (typeof payload.exp !== "number" || now > payload.exp) return null;
    if (!process.env.ADMIN_USERNAME || payload.username !== process.env.ADMIN_USERNAME) return null;
    return payload;
  } catch {
    return null;
  }
}

export function checkCredentials(username: string, password: string): boolean {
  const u = process.env.ADMIN_USERNAME;
  const p = process.env.ADMIN_PASSWORD;
  if (!u || !p) return false;
  // Evaluate both comparisons so timing does not reveal which field failed.
  const okU = safeEqual(String(username), u);
  const okP = safeEqual(String(password), p);
  return okU && okP;
}

export async function getSession(): Promise<Payload | null> {
  const { cookies } = await import("next/headers");
  return verifySessionToken((await cookies()).get(COOKIE_NAME)?.value);
}
