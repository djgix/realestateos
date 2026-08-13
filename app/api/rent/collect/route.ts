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

  // Get payment record with tenant and landlord details — filter by owner_id explicitly
  // rather than relying solely on RLS, so this stays safe if the client is ever swapped.
  const { data: payment } = await supabase
    .from('rent_payments')
    .select('*, tenants(*), profiles(*)')
    .eq('id', paymentId)
    .eq('owner_id', user.id)
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

  // Atomically claim the payment before creating a PaymentIntent, so a double-submit or a
  // collect call racing the Stripe webhook can't create two intents for the same payment.
  // rent_payments.status normally sits at 'pending' from the moment the row is created
  // (see LeaseActions.tsx), so it can't be used as a "claimed" marker on its own — every
  // unpaid payment would already match it. stripe_payment_intent_id is the real signal:
  // it's null until a collection attempt is in flight, so we claim by setting it to a
  // temporary marker under a guard that requires EITHER no intent yet OR a prior attempt
  // that's known to have failed (status='failed' — the Stripe webhook never clears the
  // intent id on failure, since payment_intent.succeeded needs it to find this row if a
  // later confirmation on the SAME intent eventually succeeds).
  const CLAIMING = 'claiming'
  const previousIntentId: string | null = payment.stripe_payment_intent_id ?? null
  const { data: claimed, error: claimErr } = await supabase
    .from('rent_payments')
    .update({ stripe_payment_intent_id: CLAIMING })
    .eq('id', paymentId)
    .or('stripe_payment_intent_id.is.null,status.eq.failed')
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
  const idempotencyKey = previousIntentId ? `collect-${paymentId}-retry-${previousIntentId}` : `collect-${paymentId}`

  try {
    const paymentIntent = await collectRent({
      amount: toCents(payment.total_amount),
      tenantCustomerId,
      landlordAccountId,
      propertyName: 'Rental Property',
      tenantName: `${payment.tenants.first_name} ${payment.tenants.last_name}`,
      idempotencyKey,
    })

    // Update payment record with the real intent ID
    const { error: persistErr } = await supabase.from('rent_payments')
      .update({ stripe_payment_intent_id: paymentIntent.id, status: 'pending' })
      .eq('id', paymentId)

    if (persistErr) {
      // Deliberately don't cancel the intent here: canceling would poison this same
      // idempotency key for the next retry (Stripe would keep returning the now-dead
      // canceled intent). Leaving it unconfirmed and live means a retry with the same
      // key safely recovers it once persistence works.
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
    await supabase.from('rent_payments').update({ stripe_payment_intent_id: previousIntentId }).eq('id', paymentId)
    return NextResponse.json({ error: 'Failed to initiate payment. Please try again.' }, { status: 500 })
  }
}
