import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTenantPortalInvite } from '@/lib/emails'

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://realestateos.com'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { lease_id } = await req.json()

  const { data: lease } = await supabase
    .from('leases')
    .select('*, tenants(first_name, last_name, email, portal_token), properties(name), profiles!owner_id(full_name)')
    .eq('id', lease_id)
    .eq('owner_id', user.id)
    .single()

  if (!lease?.tenants?.email || !lease.tenants?.portal_token) {
    return NextResponse.json({ skipped: true })
  }

  const profile = Array.isArray(lease.profiles) ? lease.profiles[0] : lease.profiles

  await sendTenantPortalInvite({
    tenantEmail: lease.tenants.email,
    tenantName: `${lease.tenants.first_name} ${lease.tenants.last_name}`,
    portalUrl: `${APP}/tenant/${lease.tenants.portal_token}`,
    propertyName: lease.properties?.name || 'your property',
    landlordName: profile?.full_name || 'Your landlord',
  })

  return NextResponse.json({ success: true })
}
