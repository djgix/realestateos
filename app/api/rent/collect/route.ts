import { NextRequest, NextResponse } from 'next/server'
const toCents = (n: number) => Math.round(n * 100)
import { collectRent } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const paymentId = body.paymentId ?? body.payment_id

  // Get payment record with tenant and landlord details
  const { data: payment } = await supabase
    .from('rent_payments')
    .select('*, tenants(*), profiles(*)')
    .eq('id', paymentId)
    .single()

  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })

  const landlordAccountId = payment.profiles?.stripe_account_id
  const tenantCustomerId = payment.tenants?.stripe_customer_id

  if (!landlordAccountId || payment.profiles?.stripe_account_status !== 'active') {
    return NextResponse.json({ error: 'Landlord has not connected their bank account yet' }, { status: 400 })
  }

  if (!tenantCustomerId) {
    return NextResponse.json({ error: 'Tenant payment method not set up' }, { status: 400 })
  }

  // Create payment intent
  const paymentIntent = await collectRent({
    amount: toCents(payment.total_amount),
    tenantCustomerId,
    landlordAccountId,
    propertyName: 'Rental Property',
    tenantName: `${payment.tenants.first_name} ${payment.tenants.last_name}`,
  })

  // Update payment record with intent ID
  await supabase.from('rent_payments')
    .update({ stripe_payment_intent_id: paymentIntent.id, status: 'pending' })
    .eq('id', paymentId)

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  })
}
