import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtected = path.startsWith('/landlord') || path.startsWith('/seller') || path.startsWith('/buyer')
  // Password recovery lands here with a freshly-exchanged session — it must not be
  // bounced away by the "already logged in" redirect below like every other /auth/* page.
  const isAuth = path.startsWith('/auth') && path !== '/auth/reset-password'

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  if (isAuth && user) {
    // Redirect to appropriate dashboard based on their product
    const { data: profile } = await supabase.from('profiles').select('product').eq('id', user.id).single()
    const dest = profile?.product === 'seller' ? '/seller/dashboard'
               : profile?.product === 'buyer'  ? '/buyer/dashboard'
               : '/landlord/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/webhooks).*)'],
}
