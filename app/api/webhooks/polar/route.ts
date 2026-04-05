import { Webhooks } from '@polar-sh/nextjs'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { sendWelcome } from '@/lib/emails'
import { logWebhook } from '@/lib/observability'

function eventDedupeKey(payload: { type: string; data: Record<string, unknown> }): string {
  const d = payload.data
  const id = (d.id as string) || (d.subscription_id as string) || JSON.stringify(d).slice(0, 200)
  return `${payload.type}:${id}`
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    if (!hasAdminClient()) {
      console.error('[polar webhook] missing service role')
      return
    }
    const admin = createAdminClient()
    const dedupe = eventDedupeKey(payload as { type: string; data: Record<string, unknown> })
    const { error: idemErr } = await admin.from('polar_webhook_events').insert({ event_id: dedupe })
    if (idemErr?.code === '23505') {
      logWebhook('polar', payload.type ?? 'unknown', { duplicate: true })
      return
    }

    try {
      if (payload.type === 'checkout.updated' && payload.data.status === 'confirmed') {
        const checkout = payload.data
        const email = checkout.customerEmail
        const metadata = checkout.metadata as Record<string, string>
        const product = metadata?.product || 'landlord'

        let planName = 'starter'
        const pid = checkout.productId
        if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_STARTER_ID) planName = 'starter'
        else if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_GROWTH_ID) planName = 'growth'
        else if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_PRO_ID) planName = 'pro'

        const { data: profile } = await admin
          .from('profiles')
          .update({ plan: planName, product, polar_customer_id: checkout.customerId })
          .eq('email', email)
          .select()
          .single()

        await admin.from('platform_payments').insert({
          owner_id: profile?.id,
          polar_order_id: checkout.id,
          product,
          plan: planName,
          amount: (checkout.totalAmount ?? 0) / 100,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
      }

      if (payload.type === 'subscription.created') {
        const sub = payload.data
        const email = sub.customer?.email
        if (!email) return

        const { data: profile } = await admin.from('profiles').select('*').eq('email', email).single()

        if (profile) {
          let planName = 'starter'
          const pid = sub.productId
          if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_GROWTH_ID) planName = 'growth'
          if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_PRO_ID) planName = 'pro'

          await admin
            .from('profiles')
            .update({
              plan: planName,
              polar_customer_id: sub.customerId,
            })
            .eq('id', profile.id)

          await sendWelcome({
            email,
            name: profile.full_name || 'there',
            product: profile.product || 'landlord',
          })
        }
      }

      if (payload.type === 'subscription.canceled' || payload.type === 'subscription.revoked') {
        const sub = payload.data
        const email = sub.customer?.email
        if (!email) return

        await admin.from('profiles').update({ plan: 'trial' }).eq('email', email)
      }
    } catch (e) {
      console.error('[polar webhook]', e)
      logWebhook('polar', payload.type ?? 'unknown', { error: String(e) })
    }
    logWebhook('polar', payload.type ?? 'unknown', {})
  },
})
