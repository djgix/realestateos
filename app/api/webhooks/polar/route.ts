import { Webhooks } from '@polar-sh/nextjs'
import { getServiceClient } from '@/lib/supabase/service'
import { sendWelcome } from '@/lib/emails'

// Resolve the profile a payload refers to, preferring the user_id stashed in
// checkout metadata (set in app/api/checkout/route.ts) over email — email isn't
// a stable identifier if the account later changes its address.
async function resolveProfile(supabase: any, { userId, email }: { userId?: string; email?: string | null }) {
  if (userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (data) return data
  }
  if (email) {
    const { data } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle()
    return data
  }
  return null
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    // Webhook requests carry no user session, so the service-role client is required —
    // the cookie-based client would run as unauthenticated and RLS would silently
    // block every write below.
    const supabase = getServiceClient() as any

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

      const existingProfile = await resolveProfile(supabase, { userId: metadata?.user_id, email })
      // Capture this before updating — it's the "have we welcomed this customer yet"
      // signal shared with the subscription.created handler below, since Polar doesn't
      // guarantee event delivery order between the two.
      const isFirstPolarAssociation = !!existingProfile && !existingProfile.polar_customer_id

      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({ plan: planName, product, polar_customer_id: checkout.customerId })
          .eq('id', existingProfile.id)

        if (isFirstPolarAssociation && existingProfile.email) {
          await sendWelcome({
            email: existingProfile.email,
            name: existingProfile.full_name || 'there',
            product: existingProfile.product || 'landlord',
          })
        }
      }

      // Log payment — skip if this checkout was already recorded (Polar retries webhooks)
      const { data: existingLog } = await supabase
        .from('platform_payments')
        .select('id')
        .eq('polar_order_id', checkout.id)
        .maybeSingle()

      if (!existingLog) {
        await supabase.from('platform_payments').insert({
          owner_id: existingProfile?.id,
          polar_order_id: checkout.id,
          product,
          plan: planName,
          amount: (checkout.totalAmount ?? 0) / 100,
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
      }
    }

    if (payload.type === 'subscription.created') {
      const sub = payload.data
      const email = sub.customer?.email
      const userId = (sub.metadata as Record<string, string> | undefined)?.user_id
      if (!email && !userId) return

      const profile = await resolveProfile(supabase, { userId, email })

      if (profile) {
        let planName = 'starter'
        const pid = sub.productId
        if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_GROWTH_ID) planName = 'growth'
        if (pid === process.env.NEXT_PUBLIC_POLAR_LANDLORD_PRO_ID) planName = 'pro'

        // Same "first association" signal used in checkout.updated above — captured
        // before the update below, since either event can be the one that actually
        // attaches polar_customer_id first depending on delivery order.
        const isFirstPolarAssociation = !profile.polar_customer_id

        if (profile.plan !== planName || profile.polar_customer_id !== sub.customerId) {
          await supabase.from('profiles').update({
            plan: planName,
            polar_customer_id: sub.customerId,
          }).eq('id', profile.id)
        }

        if (isFirstPolarAssociation && profile.email) {
          await sendWelcome({
            email: profile.email,
            name: profile.full_name || 'there',
            product: profile.product || 'landlord',
          })
        }
      }
    }

    if (payload.type === 'subscription.canceled' || payload.type === 'subscription.revoked') {
      const sub = payload.data
      const email = sub.customer?.email
      const userId = (sub.metadata as Record<string, string> | undefined)?.user_id
      if (!email && !userId) return

      const profile = await resolveProfile(supabase, { userId, email })
      if (profile) {
        await supabase.from('profiles').update({ plan: 'trial' }).eq('id', profile.id)
      }
    }
  },
})
