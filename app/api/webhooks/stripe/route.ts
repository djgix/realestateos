import { NextRequest, NextResponse } from 'next/server'
import { insertAutomationEvent } from '@/lib/automation-events'
import { getStripe } from '@/lib/stripe'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { sendRentReceipt, sendLandlordPaymentReceived } from '@/lib/emails'
import { parseLandlordPreferences } from '@/lib/landlord-preferences'
import { isQuietHoursNow } from '@/lib/quiet-hours'
import { logWebhook } from '@/lib/observability'

function subscriptionIdFromInvoice(invoice: import('stripe').Stripe.Invoice): string | undefined {
  const nested = invoice.parent?.subscription_details?.subscription
  if (nested) return typeof nested === 'string' ? nested : nested.id
  const legacy = (invoice as { subscription?: string | { id: string } | null }).subscription
  if (!legacy) return undefined
  return typeof legacy === 'string' ? legacy : legacy.id
}

export async function POST(req: NextRequest) {
  if (!hasAdminClient()) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: import('stripe').Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error: idemErr } = await admin.from('stripe_webhook_events').insert({ event_id: event.id })
  if (idemErr?.code === '23505') {
    logWebhook('stripe', event.type, { duplicate: true, id: event.id })
    return NextResponse.json({ received: true, duplicate: true })
  }
  if (idemErr) {
    console.error('[stripe webhook] idempotency insert', idemErr)
  }

  try {
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object as import('stripe').Stripe.PaymentIntent
      const paymentIntentId = pi.id

      const { data: payment } = await admin
        .from('rent_payments')
        .update({ status: 'paid', paid_date: new Date().toISOString(), stripe_payment_intent_id: paymentIntentId })
        .eq('stripe_payment_intent_id', paymentIntentId)
        .select('*, tenants(first_name, last_name, email, email_notifications), properties(name)')
        .single()

      if (payment?.tenants?.email && payment.tenants.email_notifications !== false) {
        const { data: prof } = await admin
          .from('profiles')
          .select('landlord_preferences, business_address')
          .eq('id', payment.owner_id)
          .single()
        const compliance = { businessAddress: prof?.business_address }
        await sendRentReceipt({
          tenantEmail: payment.tenants.email,
          tenantName: `${payment.tenants.first_name} ${payment.tenants.last_name}`,
          amount: payment.total_amount,
          propertyName: payment.properties?.name || 'your property',
          period: new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          compliance,
        })
        const prefs = parseLandlordPreferences(prof?.landlord_preferences)
        if (prefs.notifications.email_payment_received && !isQuietHoursNow(prefs)) {
          const { data: landlord } = await admin.from('profiles').select('email, full_name').eq('id', payment.owner_id).single()
          if (landlord?.email) {
            await sendLandlordPaymentReceived({
              landlordEmail: landlord.email,
              tenantName: `${payment.tenants.first_name} ${payment.tenants.last_name}`,
              propertyName: payment.properties?.name || 'Property',
              amount: payment.total_amount,
              period: new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
              compliance,
            })
          }
        }
      }
      if (payment) {
        await insertAutomationEvent(admin, {
          owner_id: payment.owner_id,
          kind: 'rent_payment_received',
          dedupe_key: `stripe:${event.id}:payment_received`,
          channel: 'system',
          summary: `Payment received from ${payment.tenants?.first_name ?? 'tenant'}`,
          metadata: {
            payment_id: payment.id,
            payment_intent_id: paymentIntentId,
            lease_id: payment.lease_id,
            tenant_id: payment.tenant_id,
          },
        })
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object as import('stripe').Stripe.PaymentIntent
      const { data: failedPayment } = await admin
        .from('rent_payments')
        .update({ status: 'failed' })
        .eq('stripe_payment_intent_id', pi.id)
        .select('id, owner_id, tenant_id, lease_id')
        .maybeSingle()
      if (failedPayment) {
        await insertAutomationEvent(admin, {
          owner_id: failedPayment.owner_id,
          kind: 'rent_payment_failed',
          dedupe_key: `stripe:${event.id}:payment_failed`,
          channel: 'system',
          summary: 'Stripe reported a failed rent payment',
          metadata: {
            payment_id: failedPayment.id,
            payment_intent_id: pi.id,
            lease_id: failedPayment.lease_id,
            tenant_id: failedPayment.tenant_id,
          },
        })
      }
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as import('stripe').Stripe.Account
      if (account.charges_enabled) {
        const { data: profile } = await admin
          .from('profiles')
          .update({ stripe_account_status: 'active' })
          .eq('stripe_account_id', account.id)
          .select('id')
          .maybeSingle()
        if (profile) {
          await insertAutomationEvent(admin, {
            owner_id: profile.id,
            kind: 'stripe_connect_active',
            dedupe_key: `stripe:${event.id}:connect_active`,
            channel: 'system',
            summary: 'Stripe Connect banking is active',
            metadata: { stripe_account_id: account.id },
          })
        }
      }
    }

    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as import('stripe').Stripe.Invoice
      const subId = subscriptionIdFromInvoice(invoice)
      if (subId) {
        const sub = await getStripe().subscriptions.retrieve(subId)
        const leaseId = sub.metadata?.lease_id
        if (leaseId) {
          const { data: lease } = await admin
            .from('leases')
            .select('*, tenants(first_name, last_name, email, email_notifications), properties(name)')
            .eq('id', leaseId)
            .single()
          if (lease) {
            const amount = (invoice.amount_paid ?? 0) / 100
            const due = new Date((invoice.lines?.data[0]?.period?.start ?? invoice.created) * 100)
              .toISOString()
              .slice(0, 10)
            let paymentRecordId: string | null = null
            const { data: pending } = await admin
              .from('rent_payments')
              .select('id')
              .eq('lease_id', leaseId)
              .eq('status', 'pending')
              .order('due_date', { ascending: true })
              .limit(1)
              .maybeSingle()
            if (pending) {
              paymentRecordId = pending.id
              await admin
                .from('rent_payments')
                .update({
                  status: 'paid',
                  paid_date: new Date().toISOString(),
                  total_amount: amount,
                  amount: amount,
                })
                .eq('id', pending.id)
            } else {
              const { data: inserted } = await admin.from('rent_payments').insert({
                owner_id: lease.owner_id,
                property_id: lease.property_id,
                tenant_id: lease.tenant_id,
                lease_id: leaseId,
                amount,
                late_fee: 0,
                total_amount: amount,
                due_date: due,
                status: 'paid',
                paid_date: new Date().toISOString(),
                payment_method: 'ach',
              }).select('id').maybeSingle()
              paymentRecordId = inserted?.id ?? null
            }
            const t = lease.tenants
            if (t?.email && t.email_notifications !== false) {
              const { data: prof } = await admin
                .from('profiles')
                .select('landlord_preferences, business_address')
                .eq('id', lease.owner_id)
                .single()
              await sendRentReceipt({
                tenantEmail: t.email,
                tenantName: `${t.first_name} ${t.last_name}`,
                amount,
                propertyName: lease.properties?.name || 'your property',
                period: new Date(due).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                compliance: { businessAddress: prof?.business_address },
              })
            }
            await insertAutomationEvent(admin, {
              owner_id: lease.owner_id,
              kind: 'subscription_invoice_paid',
              dedupe_key: `stripe:${event.id}:invoice_paid`,
              channel: 'system',
              summary: `Recurring rent paid by ${lease.tenants?.first_name ?? 'tenant'}`,
              metadata: {
                lease_id: leaseId,
                tenant_id: lease.tenant_id,
                subscription_id: subId,
                invoice_id: invoice.id,
                payment_id: paymentRecordId,
              },
            })
          }
        }
      }
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as import('stripe').Stripe.Invoice
      const subId = subscriptionIdFromInvoice(invoice)
      if (subId) {
        const sub = await getStripe().subscriptions.retrieve(subId)
        const leaseId = sub.metadata?.lease_id
        if (leaseId) {
          const { data: failPay } = await admin
            .from('rent_payments')
            .select('id, owner_id, tenant_id')
            .eq('lease_id', leaseId)
            .eq('status', 'pending')
            .order('due_date', { ascending: false })
            .limit(1)
            .maybeSingle()
          if (failPay) {
            await admin.from('rent_payments').update({ status: 'failed' }).eq('id', failPay.id)
            await insertAutomationEvent(admin, {
              owner_id: failPay.owner_id,
              kind: 'subscription_invoice_failed',
              dedupe_key: `stripe:${event.id}:invoice_failed`,
              channel: 'system',
              summary: 'Recurring rent invoice failed',
              metadata: {
                lease_id: leaseId,
                tenant_id: failPay.tenant_id,
                subscription_id: subId,
                invoice_id: invoice.id,
                payment_id: failPay.id,
              },
            })
          }
        }
      }
    }
  } catch (e) {
    console.error('[stripe webhook] handler', e)
    logWebhook('stripe', event.type, { error: String(e) })
  }

  logWebhook('stripe', event.type, { id: event.id })
  return NextResponse.json({ received: true })
}
