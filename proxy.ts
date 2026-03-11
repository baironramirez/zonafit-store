import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Exclude API routes, next internals, static files
  if (pathname.startsWith('/_next') || pathname.startsWith('/api') || !pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Exception for the login page itself to avoid infinite redirect loops
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Check for our custom session cookie created in /api/auth/login
  const session = request.cookies.get('zonafit_admin_session')

  if (!session || session.value !== 'authenticated_true') {
    // If there is no valid session, redirect to the login page
    const loginUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // User is authenticated, proceed to the admin area
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
  ],
}
