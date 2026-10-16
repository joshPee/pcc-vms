import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Allow all requests to pass through
  // Authentication is handled at the page level via getServerSession
  return NextResponse.next();
}
