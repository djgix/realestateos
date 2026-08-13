import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { productDashboardPath } from '@/lib/utils'

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
          return NextResponse.redirect(`${origin}${productDashboardPath(product)}`)
        }

        // The on_auth_user_created trigger creates a profile with product='none' at
        // signUp() time, before the browser gets a chance to set the real product —
        // for confirmation-required signups that browser-side update never runs (no
        // session exists yet), so backfill it here once a session is established.
        let effectiveProduct = profile.product
        if (profile.product === 'none') {
          const requestedProduct = searchParams.get('product')
          if (ALLOWED_PRODUCTS.includes(requestedProduct || '')) {
            const { error: backfillError } = await supabase.from('profiles').update({ product: requestedProduct }).eq('id', user.id)
            // Only route to the requested product if the write actually landed —
            // otherwise the profile is still 'none' and this redirect would claim a
            // destination the stored data doesn't back up.
            if (!backfillError) effectiveProduct = requestedProduct!
          }
        }

        return NextResponse.redirect(`${origin}${productDashboardPath(effectiveProduct)}`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=oauth_error`)
}
