import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getServiceClient } from '@/lib/supabase/service'
import { sendRentReceipt } from '@/lib/emails'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Webhook requests carry no user session, so the service-role client is required —
  // the cookie-based client would run as unauthenticated and RLS would silently
  // block every write below.
  const supabase = getServiceClient() as any

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as any
    const paymentIntentId = pi.id

    // Only transition rows that aren't already paid, so a Stripe retry of this event
    // doesn't resend the receipt email.
    const { data: payment } = await supabase
      .from('rent_payments')
      .update({ status: 'paid', paid_date: new Date().toISOString(), stripe_payment_intent_id: paymentIntentId })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .or('status.is.null,status.neq.paid')
      .select('*, tenants(first_name, last_name, email), properties(name)')
      .maybeSingle()

    // Send receipt to tenant
    if (payment?.tenants?.email) {
      await sendRentReceipt({
        tenantEmail: payment.tenants.email,
        tenantName: `${payment.tenants.first_name} ${payment.tenants.last_name}`,
        amount: payment.total_amount,
        propertyName: payment.properties?.name || 'your property',
        period: new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      })
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as any
    // Deliberately does NOT clear stripe_payment_intent_id: this column is the only way
    // a later payment_intent.succeeded event (Stripe reuses the same intent id across
    // confirmation retries — a failed ACH attempt followed by a successful one on the
    // same intent is a normal flow) can find this row. Clearing it here would make that
    // later success match zero rows. The collect routes' claim guard instead allows
    // reclaiming a row whose status is 'failed' even though its intent id is still set.
    await supabase
      .from('rent_payments')
      .update({ status: 'failed' })
      .eq('stripe_payment_intent_id', pi.id)
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as any
    if (account.charges_enabled) {
      await supabase
        .from('profiles')
        .update({ stripe_account_status: 'active' })
        .eq('stripe_account_id', account.id)
    }
  }

  return NextResponse.json({ received: true })
}
