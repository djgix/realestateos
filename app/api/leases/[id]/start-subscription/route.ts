import { NextResponse } from 'next/server'
import { insertAutomationEvent } from '@/lib/automation-events'
import { createClient } from '@/lib/supabase/server'
import { createRentSubscription, createTenantCustomer, getStripe } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: leaseId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`sub:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { data: lease, error } = await supabase
    .from('leases')
    .select('*, tenants(*), properties(name)')
    .eq('id', leaseId)
    .single()

  if (error || !lease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  if (lease.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: landlordProf } = await supabase
    .from('profiles')
    .select('stripe_account_id, stripe_account_status')
    .eq('id', user.id)
    .single()
  const landlord = landlordProf
  if (!landlord?.stripe_account_id || landlord.stripe_account_status !== 'active') {
    return NextResponse.json({ error: 'Connect your bank in Settings first' }, { status: 400 })
  }

  const tenant = lease.tenants as {
    id: string
    email: string
    first_name: string
    last_name: string
    stripe_customer_id: string | null
  }

  let customerId = tenant.stripe_customer_id
  if (!customerId) {
    const c = await createTenantCustomer(tenant.email, `${tenant.first_name} ${tenant.last_name}`.trim())
    customerId = c.id
    await supabase.from('tenants').update({ stripe_customer_id: customerId }).eq('id', tenant.id)
  }

  const amountCents = Math.round(Number(lease.monthly_rent) * 100)
  try {
    const subscription = await createRentSubscription({
      tenantCustomerId: customerId,
      landlordAccountId: landlord.stripe_account_id,
      amountCents,
      leaseId,
      propertyName: (lease.properties as { name: string } | null)?.name || 'Rental',
    })

    await supabase
      .from('leases')
      .update({
        status: 'active',
        stripe_subscription_id: subscription.id,
      })
      .eq('id', leaseId)

    await insertAutomationEvent(supabase, {
      owner_id: user.id,
      kind: 'stripe_subscription_started',
      dedupe_key: `lease_subscription:${leaseId}:${subscription.id}`,
      channel: 'system',
      summary: `Recurring rent started for ${tenant.first_name} ${tenant.last_name}`,
      metadata: {
        lease_id: leaseId,
        tenant_id: tenant.id,
        subscription_id: subscription.id,
        stripe_customer_id: customerId,
      },
    })

    const pi = subscription.latest_invoice as import('stripe').Stripe.Invoice | string | null
    const invId = typeof pi === 'string' ? pi : pi?.id
    let hosted_invoice_url: string | null = null
    let client_secret: string | undefined
    if (invId) {
      const inv = await getStripe().invoices.retrieve(invId)
      hosted_invoice_url = inv.hosted_invoice_url ?? null
      client_secret = inv.confirmation_secret?.client_secret
    }

    return NextResponse.json({
      subscription_id: subscription.id,
      client_secret,
      hosted_invoice_url,
      status: subscription.status,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Subscription failed'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
