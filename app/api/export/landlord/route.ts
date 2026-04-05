import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const owner = user.id
  const [props, tens, leases, pays, maint, exp, events, prof] = await Promise.all([
    supabase.from('properties').select('*').eq('owner_id', owner),
    supabase.from('tenants').select('*').eq('owner_id', owner),
    supabase.from('leases').select('*').eq('owner_id', owner),
    supabase.from('rent_payments').select('*').eq('owner_id', owner),
    supabase.from('maintenance_requests').select('*').eq('owner_id', owner),
    supabase.from('expenses').select('*').eq('owner_id', owner),
    supabase.from('automation_events').select('*').eq('owner_id', owner).order('created_at', { ascending: false }).limit(2000),
    supabase.from('profiles').select('landlord_preferences, business_address, full_name, email').eq('id', owner).single(),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    landlord_snapshot: {
      full_name: prof.data?.full_name ?? null,
      email: prof.data?.email ?? null,
      business_address: prof.data?.business_address ?? null,
      landlord_preferences: prof.data?.landlord_preferences ?? null,
    },
    properties: props.data ?? [],
    tenants: tens.data ?? [],
    leases: leases.data ?? [],
    rent_payments: pays.data ?? [],
    maintenance_requests: maint.data ?? [],
    expenses: exp.data ?? [],
    automation_events: events.data ?? [],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="realestateos-export-${owner.slice(0, 8)}.json"`,
    },
  })
}
