import { NextRequest, NextResponse } from 'next/server'
const toCents = (n: number) => Math.round(n * 100)
import { collectRent, getStripe } from '@/lib/stripe'
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
  // (see LeaseActions.tsx), so it can't be used as a "claimed" marker — every unpaid
  // payment would already match it. stripe_payment_intent_id is the real signal: it's
  // null until a collection attempt is in flight, so we claim by setting it to a
  // temporary marker under a WHERE ... IS NULL guard, then swap in the real intent ID
  // once Stripe confirms — or clear it back to null on failure so the claim releases.
  const CLAIMING = 'claiming'
  const { data: claimed, error: claimErr } = await supabase
    .from('rent_payments')
    .update({ stripe_payment_intent_id: CLAIMING })
    .eq('id', paymentId)
    .is('stripe_payment_intent_id', null)
    .or('status.is.null,status.neq.paid')
    .select()
    .maybeSingle()

  if (claimErr || !claimed) {
    return NextResponse.json({ error: 'Payment already processed or in progress' }, { status: 409 })
  }

  try {
    // Create payment intent. The idempotency key is stable across retries of this same
    // payment, so if the request is interrupted after Stripe creates the intent but
    // before we get a response, a retry returns the original intent instead of creating
    // a second one.
    const paymentIntent = await collectRent({
      amount: toCents(payment.total_amount),
      tenantCustomerId,
      landlordAccountId,
      propertyName: 'Rental Property',
      tenantName: `${payment.tenants.first_name} ${payment.tenants.last_name}`,
      idempotencyKey: `collect-${paymentId}`,
    })

    // Update payment record with the real intent ID
    const { error: persistErr } = await supabase.from('rent_payments')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', paymentId)

    if (persistErr) {
      // We can't record the intent, so the row would otherwise be stuck at the CLAIMING
      // marker with a real Stripe intent the webhook could never associate with it.
      // Cancel the intent (it's still unconfirmed at this point) and release the claim.
      await getStripe().paymentIntents.cancel(paymentIntent.id).catch(() => {})
      await supabase.from('rent_payments').update({ stripe_payment_intent_id: null }).eq('id', paymentId)
      return NextResponse.json({ error: 'Failed to initiate payment. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (err) {
    // Release the claim so this payment can be retried
    await supabase.from('rent_payments').update({ stripe_payment_intent_id: null }).eq('id', paymentId)
    return NextResponse.json({ error: 'Failed to initiate payment. Please try again.' }, { status: 500 })
  }
}
