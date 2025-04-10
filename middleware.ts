import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  console.log(`[PASSTHROUGH] Request to ${request.nextUrl.pathname}`);
  return NextResponse.next();
}

export const config = {
  // Match nothing to effectively disable middleware
  matcher: [],
}; 