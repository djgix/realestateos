import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { sendRentReceipt } from '@/lib/emails'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as any
    const paymentIntentId = pi.id

    // Update rent payment record
    const { data: payment } = await supabase
      .from('rent_payments')
      .update({ status: 'paid', paid_date: new Date().toISOString(), stripe_payment_intent_id: paymentIntentId })
      .eq('stripe_payment_intent_id', paymentIntentId)
      .select('*, tenants(first_name, last_name, email), properties(name)')
      .single()

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
