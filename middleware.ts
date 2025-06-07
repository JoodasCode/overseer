import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { initSystems } from './app/api/_init';

// Initialize systems on server startup
initSystems();

export function middleware(request: NextRequest) {
  // Continue with the request
  return NextResponse.next();
}

// This ensures the middleware runs for all routes
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
