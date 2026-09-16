import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRIMARY_HOST = 'claritys.web.id';
const LEGACY_HOSTS = new Set(['clarityz.my.id', 'www.clarityz.my.id', 'claritys.my.id', 'www.claritys.my.id', 'portf.claritys.my.id']);
const PRIVATE_PREFIXES = ['/admin', '/inbox', '/api/admin', '/api/auth'];

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0]?.toLowerCase() ?? '';
  const pathname = request.nextUrl.pathname;

  if (LEGACY_HOSTS.has(host)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https';
    url.host = PRIMARY_HOST;
    return NextResponse.redirect(url, 308);
  }

  const response = NextResponse.next();

  if (PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|preview.png).*)'],
};
