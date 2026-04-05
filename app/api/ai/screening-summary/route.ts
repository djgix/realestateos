import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { summarizeScreening } from '@/lib/ai/screening-summary'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`ai_scr:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json()
  const summary = summarizeScreening({
    background_check_status: String(body.background_check_status || 'not_run'),
    credit_score: body.credit_score != null ? Number(body.credit_score) : null,
    monthly_income: body.monthly_income != null ? Number(body.monthly_income) : null,
  })
  return NextResponse.json({ summary })
}
