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

  // Verify ownership and status
  const { data: lease } = await supabase
    .from('leases')
    .select('id, status')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!lease) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (lease.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft leases can be deleted.' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('leases')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id)
    .eq('status', 'draft')
  if (error) return NextResponse.json({ error: 'Failed to delete lease' }, { status: 500 })

  return NextResponse.json({ success: true })
}
