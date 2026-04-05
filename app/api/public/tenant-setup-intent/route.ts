import { NextRequest, NextResponse } from 'next/server'
import { insertAutomationEvent } from '@/lib/automation-events'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { verifyTenantToken } from '@/lib/tenant-portal-token'
import { createSetupIntent, createTenantCustomer } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  if (!hasAdminClient()) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }
  const body = await req.json()
  const tenantId = body.tenantId as string
  const token = body.token as string
  if (!tenantId || !token) {
    return NextResponse.json({ error: 'tenantId and token required' }, { status: 400 })
  }
  if (!verifyTenantToken(tenantId, token)) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: tenant, error } = await admin
    .from('tenants')
    .select('id, owner_id, email, first_name, last_name, stripe_customer_id')
    .eq('id', tenantId)
    .single()
  if (error || !tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let customerId = tenant.stripe_customer_id
  if (!customerId) {
    const c = await createTenantCustomer(tenant.email, `${tenant.first_name} ${tenant.last_name}`.trim())
    customerId = c.id
    await admin.from('tenants').update({ stripe_customer_id: customerId }).eq('id', tenantId)
    await insertAutomationEvent(admin, {
      owner_id: tenant.owner_id,
      kind: 'tenant_stripe_customer_ready',
      dedupe_key: `tenant_customer:${tenantId}:${customerId}`,
      channel: 'system',
      summary: `Stripe customer created for ${tenant.first_name} ${tenant.last_name}`,
      metadata: { tenant_id: tenantId, stripe_customer_id: customerId },
    })
  }

  const setupIntent = await createSetupIntent(customerId)
  return NextResponse.json({
    client_secret: setupIntent.client_secret,
    publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
  })
}
