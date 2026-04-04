import { Webhooks } from '@polar-sh/nextjs'
import { createClient } from '@/lib/supabase/server'
import { sendWelcome } from '@/lib/emails'

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const supabase = await createClient()

    if (payload.type === 'checkout.updated' && payload.data.status === 'confirmed') {
      const checkout = payload.data
      const email = checkout.customerEmail
      const metadata = checkout.metadata as Record<string, string>
      const product = metadata?.product || 'landlord'

      // Determine plan from product ID
      let plan = 'paid'
      let planName = 'starter'
      const pid = checkout.productId
      if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_STARTER_ID) planName = 'starter'
      else if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_GROWTH_ID) planName = 'growth'
      else if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_PRO_ID) planName = 'pro'
      else plan = 'paid'

      // Update profile
      const { data: profile } = await supabase
        .from('profiles')
        .update({ plan: planName, product, polar_customer_id: checkout.customerId })
        .eq('email', email)
        .select()
        .single()

      // Log payment
      await supabase.from('platform_payments').insert({
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

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (profile) {
        let planName = 'starter'
        const pid = sub.productId
        if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_GROWTH_ID) planName = 'growth'
        if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_PRO_ID) planName = 'pro'

        await supabase.from('profiles').update({
          plan: planName,
          polar_customer_id: sub.customerId,
        }).eq('id', profile.id)

        // Send welcome email
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

      await supabase.from('profiles').update({ plan: 'trial' }).eq('email', email)
    }
  },
})
