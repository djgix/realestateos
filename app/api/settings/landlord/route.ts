import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mergeLandlordPreferences, parseLandlordPreferences } from '@/lib/landlord-preferences'
import { rateLimit } from '@/lib/rate-limit'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('profiles')
    .select('landlord_preferences, business_address')
    .eq('id', user.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({
    landlord_preferences: parseLandlordPreferences(data?.landlord_preferences),
    business_address: data?.business_address ?? null,
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`settings:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const body = await req.json()
  const { data: cur } = await supabase
    .from('profiles')
    .select('landlord_preferences, business_address')
    .eq('id', user.id)
    .single()
  const merged = mergeLandlordPreferences(cur?.landlord_preferences, body.landlord_preferences ?? {})
  const { error } = await supabase
    .from('profiles')
    .update({
      landlord_preferences: merged as unknown as Record<string, unknown>,
      ...(typeof body.business_address === 'string' ? { business_address: body.business_address } : {}),
    })
    .eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({
    landlord_preferences: merged,
    business_address: typeof body.business_address === 'string' ? body.business_address : cur?.business_address,
  })
}
