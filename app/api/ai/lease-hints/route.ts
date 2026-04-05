import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { leaseHintsForState } from '@/lib/ai/lease-hints'
import { rateLimit } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`ai_lease:${user.id}`, 40, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const state = req.nextUrl.searchParams.get('state') || 'CA'
  return NextResponse.json({ hints: leaseHintsForState(state) })
}
