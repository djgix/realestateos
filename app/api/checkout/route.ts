import { NextRequest, NextResponse } from 'next/server'
import { createCheckout } from '@/lib/polar'
import { getCheckoutConfig } from '@/lib/checkout'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product, plan } = await req.json()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!
  const { productId, successUrl } = getCheckoutConfig(product, plan, baseUrl)

  const checkout = await createCheckout({
    productId,
    customerEmail: user.email!,
    successUrl,
    metadata: { user_id: user.id, product, plan: plan || 'paid' },
  })

  return NextResponse.json({ url: checkout.url })
}
