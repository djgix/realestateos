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

      if (existingProfile) {
        // Atomically claim "first association" via WHERE polar_customer_id IS NULL —
        // this is the single source of truth for "have we welcomed this customer yet",
        // shared with the subscription.created handler below. Polar doesn't guarantee
        // delivery order between the two events, and a plain read-then-write would let
        // both requests observe null and both send the welcome email.
        const { data: claimed, error: claimErr } = await supabase
          .from('profiles')
          .update({ plan: planName, product, polar_customer_id: checkout.customerId })
          .eq('id', existingProfile.id)
          .is('polar_customer_id', null)
          .select()
          .maybeSingle()

        // A genuine write error looks identical to "the other event already claimed it"
        // (both return no row) unless we check the error explicitly — without this, a
        // real DB failure would silently skip both the welcome email AND the plan/product
        // update below, while still acking the webhook as handled.
        if (claimErr) throw claimErr

        if (claimed) {
          if (claimed.email) {
            await sendWelcome({ email: claimed.email, name: claimed.full_name || 'there', product })
          }
        } else {
          // The other event already claimed it — still apply this event's plan/product
          // in case they differ, just without re-sending the welcome email.
          const { error: fallbackErr } = await supabase.from('profiles').update({ plan: planName, product, polar_customer_id: checkout.customerId }).eq('id', existingProfile.id)
          if (fallbackErr) throw fallbackErr
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

        // Same atomic "first association" claim as checkout.updated above — whichever
        // event's UPDATE actually wins the WHERE polar_customer_id IS NULL race is the
        // one that sends the welcome email.
        const { data: claimed, error: claimErr } = await supabase
          .from('profiles')
          .update({ plan: planName, polar_customer_id: sub.customerId })
          .eq('id', profile.id)
          .is('polar_customer_id', null)
          .select()
          .maybeSingle()

        // See the identical check in checkout.updated above — a real write error must
        // not be treated as "the other event already claimed it".
        if (claimErr) throw claimErr

        if (claimed) {
          if (claimed.email) {
            await sendWelcome({ email: claimed.email, name: claimed.full_name || 'there', product: claimed.product || 'landlord' })
          }
        } else if (profile.plan !== planName || profile.polar_customer_id !== sub.customerId) {
          const { error: fallbackErr } = await supabase.from('profiles').update({ plan: planName, polar_customer_id: sub.customerId }).eq('id', profile.id)
          if (fallbackErr) throw fallbackErr
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
