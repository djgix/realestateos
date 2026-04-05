import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: flow, error } = await supabase
    .from('guided_flows')
    .select('id, type, status, current_step, total_steps, property_id, tenant_id, updated_at, properties(name)')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()
  if (error || !flow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ flow })
}
