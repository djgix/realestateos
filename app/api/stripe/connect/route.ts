import { NextRequest, NextResponse } from 'next/server'
import { createConnectAccount, createAccountLink } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  let accountId = profile?.stripe_account_id

  if (!accountId) {
    const account = await createConnectAccount(user.email!)
    accountId = account.id
    await supabase.from('profiles').update({
      stripe_account_id: accountId,
      stripe_account_status: 'pending',
    }).eq('id', user.id)
  }

  const accountLink = await createAccountLink(accountId, baseUrl)
  return NextResponse.json({ url: accountLink.url })
}
