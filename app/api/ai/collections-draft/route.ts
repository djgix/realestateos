import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseLandlordPreferences } from '@/lib/landlord-preferences'
import { draftCollectionsNotice } from '@/lib/ai/collections-draft'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`ai_col:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json()
  const { data: prof } = await supabase
    .from('profiles')
    .select('landlord_preferences')
    .eq('id', user.id)
    .single()
  const prefs = parseLandlordPreferences(prof?.landlord_preferences)
  const draft = draftCollectionsNotice({
    state: String(body.state || 'your state'),
    tenantName: String(body.tenant_name || 'Tenant'),
    amount: Number(body.amount) || 0,
    daysLate: Math.max(0, Number(body.days_late) || 0),
    tone: prefs.collections.tone,
  })
  return NextResponse.json({ draft })
}
