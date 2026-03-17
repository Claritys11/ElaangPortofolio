import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be set and at least 32 characters long.');
  }
  return secret;
}

interface SessionPayload {
  username: string;
  exp: number;
}

function isAdminUsername(username: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  return Boolean(adminUsername && username === adminUsername);
}

function sign(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const encoded = Buffer.from(data).toString('base64url');
  const sig = createHmac('sha256', getSecret()).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verify(token: string): SessionPayload | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const encoded = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = createHmac('sha256', getSecret()).update(encoded).digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expected);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
    const payload: SessionPayload = JSON.parse(Buffer.from(encoded, 'base64url').toString());
    if (Date.now() > payload.exp) return null;
    if (!isAdminUsername(payload.username)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createSessionToken(username: string): string {
  return sign({ username, exp: Date.now() + SESSION_TTL_MS });
}

export function verifySessionToken(token: string): SessionPayload | null {
  return verify(token);
}

/** Read and verify the session from the incoming request (for Route Handlers). */
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Read and verify the session from the Next.js cookies() API (for Server Components / Server Actions). */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export { COOKIE_NAME, SESSION_TTL_MS };
