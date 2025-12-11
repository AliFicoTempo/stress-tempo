import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/login', '/api/auth/login', '/api/users/drivers']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('stress_tempo_session')

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const sessionData = JSON.parse(session.value)
    
    // Role-based access control
    if (pathname.startsWith('/admin') && sessionData.role !== 'admin') {
      return NextResponse.redirect(new URL('/regular', request.url))
    }

    if (pathname.startsWith('/regular') && sessionData.role !== 'regular') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Add user info to headers
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', sessionData.userId)
    requestHeaders.set('x-user-role', sessionData.role)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

  } catch (error) {
    console.error('Middleware error:', error)
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('stress_tempo_session')
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}