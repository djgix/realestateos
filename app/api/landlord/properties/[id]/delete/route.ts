import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: property } = await supabase
    .from('properties')
    .select('id')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Block if active leases exist
  const { count: activeLeases, error: leasesError } = await supabase
    .from('leases')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', id)
    .in('status', ['active', 'draft', 'sent'])

  if (leasesError) return NextResponse.json({ error: 'Failed to verify leases' }, { status: 500 })
  if ((activeLeases ?? 1) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete property with active or draft leases. Terminate them first.' },
      { status: 409 }
    )
  }

  // Block if active tenants
  const { count: activeTenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', id)
    .eq('status', 'active')

  if (tenantsError) return NextResponse.json({ error: 'Failed to verify tenants' }, { status: 500 })
  if ((activeTenants ?? 1) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete property with active tenants. Archive or reassign them first.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('properties').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })

  return NextResponse.json({ success: true })
}
