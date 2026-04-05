import { NextResponse } from 'next/server'
import { insertAutomationEvent } from '@/lib/automation-events'
import { createClient } from '@/lib/supabase/server'
import { createSetupIntent, createTenantCustomer } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`ts_si:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, owner_id, email, first_name, last_name, stripe_customer_id')
    .eq('id', id)
    .single()
  if (error || !tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  if (tenant.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let customerId = tenant.stripe_customer_id
  if (!customerId) {
    const name = `${tenant.first_name} ${tenant.last_name}`.trim()
    const customer = await createTenantCustomer(tenant.email, name)
    customerId = customer.id
    await supabase.from('tenants').update({ stripe_customer_id: customerId }).eq('id', id)
  }

  const setupIntent = await createSetupIntent(customerId)
  await insertAutomationEvent(supabase, {
    owner_id: user.id,
    kind: 'tenant_bank_setup_link_prepared',
    dedupe_key: `tenant_setup_link:${id}:${setupIntent.id}`,
    channel: 'system',
    summary: `Bank setup prepared for ${tenant.first_name} ${tenant.last_name}`,
    metadata: { tenant_id: id, stripe_customer_id: customerId, setup_intent_id: setupIntent.id },
  })

  return NextResponse.json({
    client_secret: setupIntent.client_secret,
    stripe_customer_id: customerId,
  })
}
