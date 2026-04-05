import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { triageMaintenanceDescription } from '@/lib/ai/maintenance-triage'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`ai_mt:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json()
  const description = typeof body.description === 'string' ? body.description : ''
  if (!description.trim()) return NextResponse.json({ error: 'description required' }, { status: 400 })
  return NextResponse.json({ triage: triageMaintenanceDescription(description) })
}
