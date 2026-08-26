import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.set('x-pathname', request.nextUrl.pathname)

  let supabaseResponse = NextResponse.next({
    request: {
      headers,
    },
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set({ name, value, ...options }))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set({ name, value, ...options })
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /dashboard routes based on authentication and roles
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const role = user.user_metadata?.role || user.app_metadata?.role || 'staff'
    
    // Strict Route Protection for 5 Big Roles
    if (request.nextUrl.pathname.startsWith('/dashboard/agent') && role !== 'agent') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    if (request.nextUrl.pathname.startsWith('/dashboard/staff') && role !== 'staff') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    if (request.nextUrl.pathname.startsWith('/dashboard/accountant') && role !== 'accountant') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    if (request.nextUrl.pathname.startsWith('/dashboard/production') && role !== 'production') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    if (request.nextUrl.pathname.startsWith('/dashboard/manager') && role !== 'manager') {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
    
    if (request.nextUrl.pathname.startsWith('/dashboard/sales') && !['manager', 'agent', 'accountant'].includes(role)) {
      return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
    }
  }

  // Redirect authenticated users away from login
  if (user && request.nextUrl.pathname === '/login') {
    const role = user.user_metadata?.role || user.app_metadata?.role || 'staff'
    return NextResponse.redirect(new URL(`/dashboard/${role}`, request.url))
  }

  return supabaseResponse
}
