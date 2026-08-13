import { NextRequest, NextResponse } from 'next/server'
import { collectRent, getStripe } from '@/lib/stripe'
import { getServiceClient } from '@/lib/supabase/service'
import { isPortalAccessible } from '@/lib/tenant-portal'
import { releaseClaim } from '@/lib/rent-collection'

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

  // Get landlord stripe account
  const { data: landlordProfile } = await db
    .from('profiles')
    .select('stripe_account_id, stripe_account_status')
    .eq('id', tenant.owner_id)
    .single()

  if (!landlordProfile?.stripe_account_id || landlordProfile?.stripe_account_status !== 'active') {
    return NextResponse.json({ error: 'Landlord has not connected their bank account yet' }, { status: 400 })
  }

  if (!tenant.stripe_customer_id) {
    return NextResponse.json({ error: 'Tenant payment method not set up' }, { status: 400 })
  }

  // Atomically claim the payment before creating a PaymentIntent, so a double-submit
  // can't create two intents for the same payment. rent_payments.status normally sits
  // at 'pending' from the moment the row is created (see LeaseActions.tsx), so it can't
  // be used as a "claimed" marker on its own — every unpaid payment would already match
  // it. stripe_payment_intent_id is the real signal: it's null until a collection
  // attempt is in flight, so we claim by setting it to a temporary marker under a guard
  // that requires EITHER no intent yet OR a prior attempt that's known to have failed
  // (status='failed' — the Stripe webhook never clears the intent id on failure, since
  // payment_intent.succeeded needs it to find this row if a later confirmation on the
  // SAME intent eventually succeeds).
  const CLAIMING = 'claiming'
  const previousIntentId: string | null = payment.stripe_payment_intent_id ?? null
  // stripe_payment_intent_id.neq.claiming on the failed-row branch matters: without it,
  // two concurrent claim attempts on the same failed row would both match (the marker
  // write only changes stripe_payment_intent_id, not status, so status='failed' alone
  // stays true for both after the first one commits) and both would create PaymentIntents.
  const { data: claimed, error: claimErr } = await db
    .from('rent_payments')
    .update({ stripe_payment_intent_id: CLAIMING })
    .eq('id', payment_id)
    .or('stripe_payment_intent_id.is.null,and(status.eq.failed,stripe_payment_intent_id.neq.claiming)')
    .or('status.is.null,status.neq.paid')
    .select()
    .maybeSingle()

  if (claimErr || !claimed) {
    return NextResponse.json({ error: 'Payment already processed or in progress' }, { status: 409 })
  }

  // The idempotency key must be stable across a same-attempt retry (request dropped after
  // Stripe created the intent but before we read the response — no previousIntentId at
  // claim time) so we recover the same intent, but must change on a fresh attempt after a
  // known prior failure (previousIntentId set) — reusing that key would just hand back
  // the dead, failed intent forever. Keying the retry variant off the prior intent's own
  // id keeps it deterministic without needing a schema change to track attempt counts.
  const idempotencyKey = previousIntentId ? `collect-${payment_id}-retry-${previousIntentId}` : `collect-${payment_id}`

  try {
    const paymentIntent = await collectRent({
      amount: toCents(payment.total_amount),
      tenantCustomerId: tenant.stripe_customer_id,
      landlordAccountId: landlordProfile.stripe_account_id,
      propertyName: payment.properties?.name || 'Rental Property',
      tenantName: `${tenant.first_name} ${tenant.last_name}`,
      idempotencyKey,
    })

    await getStripe().paymentIntents.update(paymentIntent.id, {
      metadata: { payment_id },
    })

    const { error: persistErr } = await db
      .from('rent_payments')
      .update({ stripe_payment_intent_id: paymentIntent.id, status: 'pending' })
      .eq('id', payment_id)

    if (persistErr) {
      // persistErr means WE didn't get a clean confirmation — the write itself may still
      // have landed (response lost on the way back). Only roll back while the row is
      // still exactly CLAIMING: if it already holds paymentIntent.id, the write actually
      // succeeded, and overwriting it back to previousIntentId here would sever the
      // webhook's only way to find this (possibly now-charged) payment. Deliberately
      // don't cancel the intent either: canceling would poison this same idempotency key
      // for the next retry (Stripe would keep returning the now-dead canceled intent).
      await releaseClaim(db, payment_id, previousIntentId, CLAIMING)
      return NextResponse.json({ error: 'Failed to initiate payment. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (err) {
    // Stripe call itself failed (or its outcome is unknown) — release the claim so this
    // payment can be retried. The idempotency key is unaffected either way: if Stripe
    // never actually created an intent, the same key is free to use again; if it did and
    // the response was merely lost, the same key safely returns that intent next time.
    await releaseClaim(db, payment_id, previousIntentId, CLAIMING)
    return NextResponse.json({ error: 'Failed to initiate payment. Please try again.' }, { status: 500 })
  }
}
