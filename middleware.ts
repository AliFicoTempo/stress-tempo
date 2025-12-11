import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = [
  '/login', 
  '/api/auth/login', 
  '/api/users/drivers', 
  '/api/shipments/freelance'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get('stress_tempo_session')

  // Debug logging
  console.log('Middleware processing:', {
    pathname,
    hasSession: !!session,
    sessionValue: session?.value ? 'exists' : 'none'
  })

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    console.log('Public path, skipping auth:', pathname)
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!session) {
    console.log('No session found, redirecting to login')
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const sessionData = JSON.parse(session.value)
    console.log('Session data:', {
      userId: sessionData.userId,
      role: sessionData.role,
      pathname
    })

    // Role-based access control for UI routes
    if (pathname.startsWith('/admin') && sessionData.role !== 'admin') {
      console.log('Unauthorized admin access attempt')
      return NextResponse.redirect(new URL('/regular', request.url))
    }

    if (pathname.startsWith('/regular') && sessionData.role !== 'regular') {
      console.log('Unauthorized regular access attempt')
      return NextResponse.redirect(new URL('/admin', request.url))
    }

    // Add user info to headers for ALL API routes (including /api/shipments/dashboard)
    const requestHeaders = new Headers(request.headers)
    
    // Ensure these are strings and not undefined
    const userId = String(sessionData.userId || '')
    const userRole = String(sessionData.role || '')
    
    console.log('Setting headers for API:', { userId, userRole })
    
    requestHeaders.set('x-user-id', userId)
    requestHeaders.set('x-user-role', userRole)

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Also add headers to response for debugging
    response.headers.set('x-middleware-user-id', userId)
    response.headers.set('x-middleware-user-role', userRole)

    console.log('Middleware headers set successfully')
    return response

  } catch (error) {
    console.error('Middleware error details:', error)
    
    // Clear invalid session
    const response = NextResponse.redirect(new URL('/login', request.url))
    response.cookies.delete('stress_tempo_session')
    
    // Log the error for debugging
    response.headers.set('x-middleware-error', 'session_parsing_failed')
    
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
}