import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Validate shape
  const enabled = typeof body.enabled === 'boolean' ? body.enabled : false
  const grace_days = typeof body.grace_days === 'number'
    ? Math.max(0, Math.min(30, body.grace_days)) : 3
  const steps = Array.isArray(body.steps) ? body.steps.slice(0, 10).map((s: any) => ({
    day: typeof s.day === 'number' ? Math.max(1, s.day) : 1,
    label: String(s.label || '').slice(0, 100),
    channel: ['sms','email','both'].includes(s.channel) ? s.channel : 'email',
    auto_send: typeof s.auto_send === 'boolean' ? s.auto_send : false,
    message: String(s.message || '').slice(0, 2000),
  })) : []

  const config = { enabled, grace_days, steps }

  const { error } = await supabase
    .from('profiles')
    .update({ collections_config: config })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
