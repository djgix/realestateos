import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`scr_dec:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json()
  const decision = body.decision === 'approve' ? 'approve' : body.decision === 'decline' ? 'decline' : null
  if (!decision) return NextResponse.json({ error: 'decision must be approve or decline' }, { status: 400 })

  const { data: tenant, error: fe } = await supabase.from('tenants').select('id, owner_id').eq('id', id).single()
  if (fe || !tenant || tenant.owner_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const status = decision === 'approve' ? 'active' : 'past'
  const { error: up } = await supabase.from('tenants').update({ status }).eq('id', id)
  if (up) return NextResponse.json({ error: up.message }, { status: 400 })
  return NextResponse.json({ ok: true, status })
}
