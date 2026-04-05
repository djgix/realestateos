import { NextResponse } from 'next/server'
import { insertAutomationEvent } from '@/lib/automation-events'
import { createClient } from '@/lib/supabase/server'
import { createTenantCustomer } from '@/lib/stripe'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`tscust:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('id, owner_id, email, first_name, last_name, stripe_customer_id')
    .eq('id', id)
    .single()
  if (error || !tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  if (tenant.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (tenant.stripe_customer_id) {
    return NextResponse.json({ stripe_customer_id: tenant.stripe_customer_id, existing: true })
  }

  const name = `${tenant.first_name} ${tenant.last_name}`.trim()
  const customer = await createTenantCustomer(tenant.email, name)
  const { error: upErr } = await supabase
    .from('tenants')
    .update({ stripe_customer_id: customer.id })
    .eq('id', id)
    .eq('owner_id', user.id)
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  await insertAutomationEvent(supabase, {
    owner_id: user.id,
    kind: 'tenant_stripe_customer_ready',
    dedupe_key: `tenant_customer:${id}:${customer.id}`,
    channel: 'system',
    summary: `Stripe customer created for ${tenant.first_name} ${tenant.last_name}`,
    metadata: { tenant_id: id, stripe_customer_id: customer.id },
  })

  return NextResponse.json({ stripe_customer_id: customer.id, existing: false })
}
