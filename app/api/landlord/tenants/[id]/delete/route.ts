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
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, status')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Block if active lease
  const { count: activeLeases } = await supabase
    .from('leases')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', id)
    .in('status', ['active', 'draft', 'sent'])

  if ((activeLeases ?? 0) > 0) {
    return NextResponse.json(
      { error: 'Cannot delete tenant with an active lease. Terminate the lease first.' },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('tenants').delete().eq('id', id)
  if (error) return NextResponse.json({ error: 'Failed to delete tenant' }, { status: 500 })

  return NextResponse.json({ success: true })
}
