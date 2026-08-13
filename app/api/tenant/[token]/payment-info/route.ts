import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { isPortalAccessible } from '@/lib/tenant-portal'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = getServiceClient() as any

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, property_id, status, properties(name), profiles!owner_id(settings)')
    .eq('portal_token', token)
    .single()

  if (tenantError) return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  if (!tenant) return NextResponse.json({ error: 'Invalid token' }, { status: 404 })
  if (!isPortalAccessible(tenant, Array.isArray(tenant.profiles) ? tenant.profiles[0] : tenant.profiles)) {
    return NextResponse.json({ error: 'Portal access unavailable' }, { status: 403 })
  }

  // Find the next pending or late payment
  const { data: payment } = await supabase
    .from('rent_payments')
    .select('*')
    .eq('tenant_id', tenant.id)
    .in('status', ['pending', 'late'])
    .order('due_date', { ascending: true })
    .limit(1)
    .single()

  if (!payment) return NextResponse.json({ payment_id: null })

  return NextResponse.json({
    payment_id: payment.id,
    amount: payment.total_amount,
    period: payment.due_date,
    status: payment.status,
    property_name: (tenant.properties as any)?.name || 'your property',
  })
}
