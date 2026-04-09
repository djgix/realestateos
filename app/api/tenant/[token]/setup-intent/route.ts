import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getStripe, createTenantCustomer } from '@/lib/stripe'

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://realestateos.com'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = getServiceClient() as any

  const { data: tenant } = await db
    .from('tenants')
    .select('id, owner_id, email, first_name, last_name, stripe_customer_id')
    .eq('portal_token', token)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })

  let customerId = tenant.stripe_customer_id
  if (!customerId) {
    const customer = await createTenantCustomer(
      tenant.email,
      `${tenant.first_name} ${tenant.last_name}`
    )
    customerId = customer.id
    await db.from('tenants').update({ stripe_customer_id: customerId }).eq('id', tenant.id)
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'setup',
    payment_method_types: ['us_bank_account'],
    customer: customerId,
    success_url: `${APP}/tenant/${token}/payment-setup?success=1`,
    cancel_url: `${APP}/tenant/${token}`,
  })

  return NextResponse.json({ url: session.url })
}
