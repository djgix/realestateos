import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTenantPortalInvite } from '@/lib/emails'

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://realestateos.com'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tenant_id } = await req.json()
  if (!tenant_id) return NextResponse.json({ error: 'Missing tenant_id' }, { status: 400 })

  // Get tenant + property, verify ownership
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, properties(name)')
    .eq('id', tenant_id)
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  if (!tenant.portal_token) return NextResponse.json({ error: 'Tenant has no portal token' }, { status: 400 })
  if (!tenant.email) return NextResponse.json({ error: 'Tenant has no email address' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  await sendTenantPortalInvite({
    tenantEmail: tenant.email,
    tenantName: `${tenant.first_name} ${tenant.last_name}`,
    portalUrl: `${APP}/tenant/${tenant.portal_token}`,
    propertyName: tenant.properties?.name || 'your property',
    landlordName: profile?.full_name || 'Your landlord',
  })

  return NextResponse.json({ success: true })
}
