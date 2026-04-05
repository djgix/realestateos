import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendOfferReceived } from '@/lib/emails'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`seller_offer:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()
  const {
    listing_id,
    buyer_name,
    buyer_email,
    offer_amount,
    earnest_money,
    financing_type,
    closing_date_requested,
    inspection_period,
    notes,
  } = body as Record<string, unknown>

  if (!listing_id || typeof listing_id !== 'string') {
    return NextResponse.json({ error: 'listing_id required' }, { status: 400 })
  }
  if (!buyer_name || typeof buyer_name !== 'string') {
    return NextResponse.json({ error: 'buyer_name required' }, { status: 400 })
  }
  if (offer_amount === undefined || Number(offer_amount) <= 0) {
    return NextResponse.json({ error: 'offer_amount required' }, { status: 400 })
  }

  const { data: listing, error: le } = await supabase
    .from('seller_listings')
    .select('id, owner_id, address, city, state')
    .eq('id', listing_id)
    .single()
  if (le || !listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
  if (listing.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: offer, error: insErr } = await supabase
    .from('seller_offers')
    .insert({
      listing_id,
      owner_id: user.id,
      buyer_name,
      buyer_email: typeof buyer_email === 'string' ? buyer_email : null,
      offer_amount: Number(offer_amount),
      earnest_money: earnest_money != null ? Number(earnest_money) : null,
      financing_type: typeof financing_type === 'string' ? financing_type : null,
      closing_date_requested: typeof closing_date_requested === 'string' ? closing_date_requested : null,
      inspection_period: inspection_period != null ? Number(inspection_period) : 10,
      notes: typeof notes === 'string' ? notes : null,
      status: 'received',
    })
    .select()
    .single()
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 400 })

  const { data: profile } = await supabase.from('profiles').select('email, full_name').eq('id', user.id).single()
  if (profile?.email) {
    const addr = `${listing.address}, ${listing.city}, ${listing.state}`
    await sendOfferReceived({
      sellerEmail: profile.email,
      sellerName: profile.full_name || 'there',
      buyerName: buyer_name,
      offerAmount: Number(offer_amount),
      address: addr,
    })
  }

  return NextResponse.json({ offer })
}
