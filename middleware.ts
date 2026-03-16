import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // We renamed export function proxy(request) to export function middleware(request)
  // because Next.js requires the function to be named "middleware" in middleware.ts
  const { pathname } = request.nextUrl
  
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || !pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // The client-side layout in app/admin/layout.tsx already handles the robust Firebase Auth role check.
  // The old custom 'zonafit_admin_session' cookie logic was deprecated when moving to Firebase.
  // Therefore, we let the request pass through to the layout.tsx which will perform the 
  // secure client-side role verification using AuthContext.

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
