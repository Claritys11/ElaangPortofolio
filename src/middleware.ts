import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getStorageType } from '@/lib/storage-type';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiRoute = path.startsWith('/api/');
  const isAuthRoute = path.startsWith('/api/auth/');

  if (isApiRoute && !isAuthRoute && getStorageType() === 'firebase') {
    return NextResponse.json(
      {
        error:
          'API endpoints are deactivated when NEXT_PUBLIC_STORAGE_TYPE is set to firebase. Use Firebase client access directly.',
      },
      { status: 502 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
