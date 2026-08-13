import { NextRequest, NextResponse } from 'next/server'
import { collectRent, getStripe } from '@/lib/stripe'
import { getServiceClient } from '@/lib/supabase/service'
import { isPortalAccessible } from '@/lib/tenant-portal'

const toCents = (n: number) => Math.round(n * 100)

export async function POST(req: NextRequest) {
  const { portal_token, payment_id } = await req.json()

  if (!portal_token || !payment_id) {
    return NextResponse.json({ error: 'Missing portal_token or payment_id' }, { status: 400 })
  }

  const db = getServiceClient() as any

  // Validate portal_token → tenant
  const { data: tenant } = await db
    .from('tenants')
    .select('id, owner_id, stripe_customer_id, first_name, last_name, status, profiles!owner_id(settings)')
    .eq('portal_token', portal_token)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Invalid portal token' }, { status: 403 })
  }
  if (!isPortalAccessible(tenant, Array.isArray(tenant.profiles) ? tenant.profiles[0] : tenant.profiles)) {
    return NextResponse.json({ error: 'Portal access unavailable' }, { status: 403 })
  }

  // Get payment and verify it belongs to this tenant
  const { data: payment } = await db
    .from('rent_payments')
    .select('*, properties(name)')
    .eq('id', payment_id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  }

  // Atomically claim the payment by transitioning status to 'pending' only if it is
  // currently in a collectible state. This prevents race conditions where two concurrent
  // requests both see status='open' and both create a PaymentIntent.
  const { data: claimed, error: claimErr } = await db
    .from('rent_payments')
    .update({ status: 'pending' })
    .eq('id', payment_id)
    .not('status', 'in', '("paid","pending")')
    .select()
    .single()

  if (claimErr || !claimed) {
    return NextResponse.json({ error: 'Payment already processed or in progress' }, { status: 409 })
  }

  // Get landlord stripe account
  const { data: landlordProfile } = await db
    .from('profiles')
    .select('stripe_account_id, stripe_account_status')
    .eq('id', tenant.owner_id)
    .single()

  if (!landlordProfile?.stripe_account_id || landlordProfile?.stripe_account_status !== 'active') {
    // Release the claim so the payment can be retried
    await db.from('rent_payments').update({ status: payment.status }).eq('id', payment_id)
    return NextResponse.json({ error: 'Landlord has not connected their bank account yet' }, { status: 400 })
  }

  if (!tenant.stripe_customer_id) {
    // Release the claim so the payment can be retried
    await db.from('rent_payments').update({ status: payment.status }).eq('id', payment_id)
    return NextResponse.json({ error: 'Tenant payment method not set up' }, { status: 400 })
  }

  const paymentIntent = await collectRent({
    amount: toCents(payment.total_amount),
    tenantCustomerId: tenant.stripe_customer_id,
    landlordAccountId: landlordProfile.stripe_account_id,
    propertyName: payment.properties?.name || 'Rental Property',
    tenantName: `${tenant.first_name} ${tenant.last_name}`,
  })

  await getStripe().paymentIntents.update(paymentIntent.id, {
    metadata: { payment_id },
  })

  await db
    .from('rent_payments')
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq('id', payment_id)

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  })
}
