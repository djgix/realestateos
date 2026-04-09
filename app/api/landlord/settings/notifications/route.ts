import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NOTIF_KEYS = ['late_rent','lease_expiry','maintenance','payment_received','lease_signed','weekly']
const SETTINGS_KEYS = ['automation','rent_defaults','maintenance','portal','communications']

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const update: Record<string, any> = {}

  if (body.notifications && typeof body.notifications === 'object') {
    const safeNotif = Object.fromEntries(
      Object.entries(body.notifications).filter(([k, v]) => NOTIF_KEYS.includes(k) && typeof v === 'boolean')
    )
    update.notifications_config = safeNotif
  }

  if (body.settings && typeof body.settings === 'object') {
    const safeSettings = Object.fromEntries(
      Object.entries(body.settings).filter(([k]) => SETTINGS_KEYS.includes(k))
    )
    update.settings = safeSettings
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').update(update).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
