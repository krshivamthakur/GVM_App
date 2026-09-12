import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow static assets, images, api routes, and public files to pass through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Session & Cookie resolution
  const authUserId = request.cookies.get('auth_user_id')?.value
  const authRole = request.cookies.get('auth_role')?.value

  // Helper to determine destination portal by role
  const getRolePortal = (role?: string) => {
    if (role === 'admin') return '/admin'
    if (role === 'teacher') return '/teacher'
    return '/student'
  }

  // 1. Unauthenticated users attempting to access protected routes
  const isProtectedPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/student')

  if (isProtectedPath && !authUserId) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 2. Authenticated users attempting to access guest auth routes or root '/'
  const isAuthOrRootPath =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/forgot-password'

  if (isAuthOrRootPath && authUserId) {
    const targetPortal = getRolePortal(authRole)
    return NextResponse.redirect(new URL(targetPortal, request.url))
  }

  // 3. Role-Based Access Control (RBAC) route guards for authenticated users
  if (authUserId) {
    if (pathname.startsWith('/admin') && authRole !== 'admin') {
      const redirectUrl = authRole === 'teacher' ? '/teacher' : '/student'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    if (pathname.startsWith('/teacher') && authRole !== 'teacher' && authRole !== 'admin') {
      return NextResponse.redirect(new URL('/student', request.url))
    }
  }

  // Update Supabase session if configured
  try {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
