import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware that allows all requests in development
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|auth/signin|auth/error).*)',
  ],
};
