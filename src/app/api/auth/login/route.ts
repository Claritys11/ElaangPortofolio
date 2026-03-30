import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionToken, COOKIE_NAME, SESSION_TTL_MS } from '@/lib/session';
import { createAccessLog } from '@/lib/server-storage';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const adminUsername = process.env.ADMIN_USERNAME ?? process.env.admin_username;
    const adminPassword = process.env.ADMIN_PASSWORD ?? process.env.admin_password;


    if (!adminUsername || !adminPassword) {
      return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
    }

    const valid = username === adminUsername && password === adminPassword;

    // Log the access attempt server-side regardless of outcome
    try {
      await createAccessLog({
        username: username ?? '(unknown)',
        accessedAt: new Date().toISOString(),
        accessSuccessful: valid,
        ip: req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown',
      });
    } catch {
      // Non-fatal: logging failure should not block auth response
    }

    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const token = createSessionToken(username);
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: SESSION_TTL_MS / 1000,
      path: '/',
    });

    return NextResponse.json({ ok: true, username });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ADMIN_SESSION_SECRET')) {
      return NextResponse.json({ error: 'Server misconfiguration.' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Bad request.' }, { status: 400 });
  }
}
