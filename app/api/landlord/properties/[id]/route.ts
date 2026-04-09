import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const ALLOWED = ['name','address','city','state','zip','type','units','purchase_price',
    'current_value','mortgage_balance','monthly_mortgage','year_built','square_feet',
    'bedrooms','bathrooms','notes','photo_url']
  const safe = Object.fromEntries(Object.entries(body).filter(([k]) => ALLOWED.includes(k)))

  const { error } = await supabase
    .from('properties')
    .update(safe)
    .eq('id', id)
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
