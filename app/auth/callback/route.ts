import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
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
          await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
            email: user.email!,
            avatar_url: user.user_metadata?.avatar_url,
            product: 'landlord', // default product
          })
          return NextResponse.redirect(`${origin}/landlord/dashboard`)
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
