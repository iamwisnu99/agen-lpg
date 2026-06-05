import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  // CORS Protection for API routes
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/cron/')) {
    const origin = request.headers.get('origin') || request.headers.get('referer') || ''
    const host = request.headers.get('host') || ''
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1')
    
    if (!isLocalhost) {
      if (!origin || !origin.startsWith('https://agen-lpg.netlify.app')) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden', message: 'CORS Policy Violation: Origin not allowed' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Handle OPTIONS request early
    if (request.method === 'OPTIONS') {
      const response = new NextResponse(null, { status: 204 })
      const allowedOrigin = origin.startsWith('http://localhost') ? origin : 'https://agen-lpg.netlify.app'
      response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
      return response
    }
  }
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth pages (no auth required)
  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register')

  // Protected dashboard routes
  const isDashboard =
    request.nextUrl.pathname.startsWith('/dashboard') ||
    request.nextUrl.pathname.startsWith('/pangkalan') ||
    request.nextUrl.pathname.startsWith('/peta') ||
    request.nextUrl.pathname.startsWith('/aktivitas') ||
    request.nextUrl.pathname.startsWith('/pengaturan')

  // Redirect unauthenticated users away from protected routes
  if (!user && isDashboard) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from login/register/landing
  const isLandingPage = request.nextUrl.pathname === '/'
  if (user && (isAuthPage || isLandingPage)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin') || request.headers.get('referer') || ''
    const allowedOrigin = origin.startsWith('http://localhost') ? origin : 'https://agen-lpg.netlify.app'
    
    supabaseResponse.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
