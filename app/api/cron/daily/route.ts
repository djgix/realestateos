import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin'
import { runDailyAutomation } from '@/lib/cron/run-daily'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasAdminClient()) {
    return NextResponse.json({ error: 'Server misconfigured: SUPABASE_SERVICE_ROLE_KEY' }, { status: 503 })
  }
  try {
    const admin = createAdminClient()
    const counts = await runDailyAutomation(admin)
    return NextResponse.json({ ok: true, counts })
  } catch (e) {
    console.error('[cron/daily]', e)
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 })
  }
}
