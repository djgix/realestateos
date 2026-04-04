import { NextRequest, NextResponse } from 'next/server'
import { createCheckout, POLAR_PRODUCTS } from '@/lib/polar'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { product, plan } = await req.json()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!

  let productId: string
  let successUrl: string

  if (product === 'landlord') {
    productId = plan === 'growth' ? POLAR_PRODUCTS.landlord_growth
               : plan === 'pro'   ? POLAR_PRODUCTS.landlord_pro
               : POLAR_PRODUCTS.landlord_starter
    successUrl = `${baseUrl}/landlord/dashboard?upgraded=true`
  } else if (product === 'seller') {
    productId = POLAR_PRODUCTS.seller
    successUrl = `${baseUrl}/seller/dashboard?activated=true`
  } else if (product === 'buyer') {
    productId = POLAR_PRODUCTS.buyer
    successUrl = `${baseUrl}/buyer/dashboard?activated=true`
  } else if (product === 'bundle') {
    productId = POLAR_PRODUCTS.bundle
    successUrl = `${baseUrl}/landlord/dashboard?bundle=true`
  } else {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400 })
  }

  const checkout = await createCheckout({
    productId,
    customerEmail: user.email!,
    successUrl,
    metadata: { user_id: user.id, product, plan: plan || 'paid' },
  })

  return NextResponse.json({ url: checkout.url })
}
