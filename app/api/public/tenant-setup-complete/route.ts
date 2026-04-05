import { NextRequest, NextResponse } from 'next/server'
import { insertAutomationEvent } from '@/lib/automation-events'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { verifyTenantToken } from '@/lib/tenant-portal-token'

export async function POST(req: NextRequest) {
  if (!hasAdminClient()) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 503 })
  }

  const body = await req.json()
  const tenantId = body.tenantId as string
  const token = body.token as string
  const setupIntentId = body.setupIntentId as string | undefined
  const status = body.status as string | undefined

  if (!tenantId || !token) {
    return NextResponse.json({ error: 'tenantId and token required' }, { status: 400 })
  }
  if (!verifyTenantToken(tenantId, token)) {
    return NextResponse.json({ error: 'Invalid link' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: tenant, error } = await admin
    .from('tenants')
    .select('id, owner_id, first_name, last_name')
    .eq('id', tenantId)
    .single()
  if (error || !tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await admin.from('tenants').update({ portal_access: true }).eq('id', tenantId)

  if (setupIntentId && status === 'succeeded') {
    await insertAutomationEvent(admin, {
      owner_id: tenant.owner_id,
      kind: 'tenant_bank_setup_completed',
      dedupe_key: `tenant_setup_complete:${tenantId}:${setupIntentId}`,
      channel: 'system',
      summary: `Bank account saved by ${tenant.first_name} ${tenant.last_name}`,
      metadata: { tenant_id: tenantId, setup_intent_id: setupIntentId },
    })
  }

  return NextResponse.json({ ok: true })
}
