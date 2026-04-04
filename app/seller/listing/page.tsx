import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Home, Plus, MapPin, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function SellerListingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: listings } = await supabase
    .from('seller_listings')
    .select('*, seller_offers(*)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const STATUS_COLORS: Record<string, string> = {
    prep: 'bg-slate-700 text-slate-400',
    active: 'bg-green-400/10 text-green-400',
    under_contract: 'bg-blue-400/10 text-blue-400',
    sold: 'bg-purple-400/10 text-purple-400',
    cancelled: 'bg-red-400/10 text-red-400',
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">My Listing</h1>
          <p className="page-subtitle">{listings?.length || 0} properties</p>
        </div>
        <Link href="/seller/listing/new" className="btn-seller">
          <Plus className="w-4 h-4" /> New listing
        </Link>
      </div>

      {!listings?.length ? (
        <div className="card p-16 text-center">
          <Home className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-display text-2xl text-slate-300 mb-2">No listings yet</h3>
          <p className="text-slate-500 mb-4 max-w-md mx-auto">
            The average agent takes 5–6% commission. On a $400,000 home that's $24,000. SellerOS guides you through every step for $299.
          </p>
          <p className="font-display text-2xl text-seller mb-6">You keep the $24,000.</p>
          <Link href="/seller/listing/new" className="btn-seller inline-flex">
            <Plus className="w-4 h-4" /> Start my listing
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing: any) => {
            const commissionSaved = listing.asking_price * 0.06
            const offers = listing.seller_offers || []
            return (
              <div key={listing.id} className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`badge text-xs capitalize ${STATUS_COLORS[listing.status] || 'bg-slate-700 text-slate-400'}`}>
                        {listing.status.replace('_', ' ')}
                      </span>
                      {listing.listed_date && (
                        <span className="text-xs text-slate-500">Listed {formatDate(listing.listed_date)}</span>
                      )}
                    </div>
                    <h3 className="font-display text-2xl text-white mb-1">{listing.address}</h3>
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                      <MapPin className="w-3.5 h-3.5" />
                      {listing.city}, {listing.state} {listing.zip}
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="font-display text-xl text-seller">{formatCurrency(listing.asking_price)}</p>
                        <p className="text-xs text-slate-500">Asking price</p>
                      </div>
                      <div>
                        <p className="font-display text-xl text-green-400">{formatCurrency(commissionSaved)}</p>
                        <p className="text-xs text-slate-500">Commission saved</p>
                      </div>
                      <div>
                        <p className="font-display text-xl text-slate-200">{offers.length}</p>
                        <p className="text-xs text-slate-500">Offers received</p>
                      </div>
                      <div>
                        <p className="font-display text-xl text-slate-200">
                          {listing.bedrooms}bd/{listing.bathrooms}ba
                        </p>
                        <p className="text-xs text-slate-500">{listing.square_feet?.toLocaleString()} sqft</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link href={`/seller/offers?listing=${listing.id}`} className="btn-seller text-sm">
                      View offers <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link href={`/seller/documents?listing=${listing.id}`} className="btn-secondary text-sm">
                      Documents
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
