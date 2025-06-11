import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple middleware for development
export function middleware(request: NextRequest) {
  // Log auth-related requests for debugging
  if (request.nextUrl.pathname.includes('auth') || request.nextUrl.pathname.includes('dashboard')) {
    console.log('🌐 Middleware:', request.nextUrl.pathname, 'User-Agent:', request.headers.get('user-agent')?.slice(0, 50));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)',
  ],
};
