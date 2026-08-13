import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { getStripe, createTenantCustomer } from '@/lib/stripe'
import { isPortalAccessible } from '@/lib/tenant-portal'

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://realestateos.com'

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const db = getServiceClient() as any

  const { data: tenant } = await db
    .from('tenants')
    .select('id, owner_id, email, first_name, last_name, stripe_customer_id, status, profiles!owner_id(settings)')
    .eq('portal_token', token)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
  if (!isPortalAccessible(tenant, Array.isArray(tenant.profiles) ? tenant.profiles[0] : tenant.profiles)) {
    return NextResponse.json({ error: 'Portal access unavailable' }, { status: 403 })
  }

  let customerId = tenant.stripe_customer_id
  if (!customerId) {
    const customer = await createTenantCustomer(
      tenant.email,
      `${tenant.first_name} ${tenant.last_name}`
    )
    customerId = customer.id
    // Only update if stripe_customer_id is still null (atomic guard against concurrent
    // requests). .select() is required here — without it PostgREST returns 204 with no
    // error regardless of whether the row-matching filter actually matched anything, so
    // the "did we win the race" check would always look like a win.
    const { data: claimed } = await db
      .from('tenants')
      .update({ stripe_customer_id: customerId })
      .eq('id', tenant.id)
      .is('stripe_customer_id', null)
      .select('stripe_customer_id')
      .maybeSingle()
    if (!claimed) {
      // Another request won the race — re-fetch to get the definitive customer ID
      const { data: freshTenant } = await db
        .from('tenants')
        .select('stripe_customer_id')
        .eq('id', tenant.id)
        .single()
      if (freshTenant?.stripe_customer_id) {
        customerId = freshTenant.stripe_customer_id
      }
    }
  }

  const session = await getStripe().checkout.sessions.create({
    mode: 'setup',
    payment_method_types: ['us_bank_account'],
    customer: customerId,
    success_url: `${APP}/tenant/${token}/payment-setup?success=1`,
    cancel_url: `${APP}/tenant/${token}`,
  })

  return NextResponse.json({ url: session.url })
}
