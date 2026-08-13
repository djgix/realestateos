import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_PRODUCTS = ['landlord', 'seller', 'buyer', 'bundle']

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Password-recovery links carry `next` and don't need profile-based routing —
      // the session is established above, so send them straight to their destination.
      if (next && next.startsWith('/')) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Get user and redirect to appropriate dashboard
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Check if profile exists, create if not (first Google login)
        const { data: profile } = await supabase
          .from('profiles')
          .select('product')
          .eq('id', user.id)
          .single()

        if (!profile) {
          const requestedProduct = searchParams.get('product')
          const product = ALLOWED_PRODUCTS.includes(requestedProduct || '') ? requestedProduct! : 'landlord'
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            email: user.email!,
            avatar_url: user.user_metadata?.avatar_url,
            product,
          })
          if (insertError) {
            return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`)
          }
          const dest = product === 'seller' ? '/seller/dashboard' : product === 'buyer' ? '/buyer/dashboard' : '/landlord/dashboard'
          return NextResponse.redirect(`${origin}${dest}`)
        }

        const dest = profile?.product === 'seller' ? '/seller/dashboard'
                   : profile?.product === 'buyer'  ? '/buyer/dashboard'
                   : '/landlord/dashboard'

        return NextResponse.redirect(`${origin}${dest}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`)
}
