import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { FileText, Plus, ThumbsUp, ThumbsDown, ArrowRight, DollarSign } from 'lucide-react'
import Link from 'next/link'

export default async function SellerOffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: listings } = await supabase
    .from('seller_listings')
    .select('id, address')
    .eq('owner_id', user!.id)
  const { data: offers } = await supabase
    .from('seller_offers')
    .select('*, seller_listings(address, asking_price)')
    .eq('owner_id', user!.id)
    .order('received_at', { ascending: false })

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    received:   { label: 'Received',   color: 'bg-yellow-400/10 text-yellow-400' },
    countered:  { label: 'Countered',  color: 'bg-blue-400/10 text-blue-400' },
    accepted:   { label: 'Accepted',   color: 'bg-green-400/10 text-green-400' },
    rejected:   { label: 'Rejected',   color: 'bg-red-400/10 text-red-400' },
    expired:    { label: 'Expired',    color: 'bg-slate-700 text-slate-500' },
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Offers</h1>
          <p className="page-subtitle">{offers?.length || 0} total offers</p>
        </div>
      </div>

      {!offers?.length ? (
        <div className="card p-16 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-display text-2xl text-slate-300 mb-2">No offers yet</h3>
          <p className="text-slate-500 mb-6">Once your home is listed, offers will appear here for you to review and respond to.</p>
          <Link href="/seller/listing" className="btn-seller inline-flex">View my listing</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer: any) => {
            const config = STATUS_CONFIG[offer.status] || STATUS_CONFIG.received
            const askingPrice = offer.seller_listings?.asking_price || 0
            const diff = offer.offer_amount - askingPrice
            const diffPct = askingPrice > 0 ? ((diff / askingPrice) * 100).toFixed(1) : '0'
            return (
              <div key={offer.id} className="card p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`badge text-xs ${config.color}`}>{config.label}</span>
                      <span className="text-xs text-slate-500">{formatDate(offer.received_at)}</span>
                    </div>
                    <div className="flex items-baseline gap-3 mb-1">
                      <p className="font-display text-3xl text-seller">{formatCurrency(offer.offer_amount)}</p>
                      <span className={`text-sm font-medium ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diffPct}% {diff >= 0 ? 'over' : 'under'} asking)
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">From <strong className="text-slate-200">{offer.buyer_name}</strong> · {offer.seller_listings?.address}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: 'Financing', value: offer.financing_type?.toUpperCase() || '—' },
                        { label: 'Earnest Money', value: offer.earnest_money ? formatCurrency(offer.earnest_money) : '—' },
                        { label: 'Closing Date', value: offer.closing_date_requested ? formatDate(offer.closing_date_requested) : '—' },
                        { label: 'Inspection', value: `${offer.inspection_period || 10} days` },
                      ].map(item => (
                        <div key={item.label} className="bg-slate-800/50 rounded-xl p-3">
                          <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                          <p className="text-sm font-medium text-slate-200">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {offer.contingencies?.length > 0 && (
                      <div className="mt-3 flex gap-2 flex-wrap">
                        <span className="text-xs text-slate-500">Contingencies:</span>
                        {offer.contingencies.map((c: string) => (
                          <span key={c} className="badge bg-slate-800 text-slate-400 text-xs capitalize">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {offer.status === 'received' && (
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button className="btn-seller text-sm">
                        <ThumbsUp className="w-4 h-4" /> Accept
                      </button>
                      <button className="btn-secondary text-sm">
                        Counter
                      </button>
                      <button className="btn-danger text-sm">
                        <ThumbsDown className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* OFFER ANALYSIS GUIDE */}
      <div className="card p-6 mt-8 bg-seller/5 border-seller/20">
        <h2 className="section-title">How to Analyze an Offer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'Price isn\'t everything', desc: 'A cash offer at 95% of asking beats a financed offer at 103% if the appraisal falls short.' },
            { title: 'Check the contingencies', desc: 'Inspection, financing, and appraisal contingencies all give buyers a way to back out. Fewer contingencies = stronger offer.' },
            { title: 'Closing date matters', desc: 'Does their closing date work with your timeline? A flexible closing can be worth thousands.' },
            { title: 'Earnest money signals commitment', desc: 'Higher earnest money shows the buyer is serious. They lose it if they back out without cause.' },
          ].map(tip => (
            <div key={tip.title} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-seller mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200 mb-1">{tip.title}</p>
                <p className="text-xs text-slate-500">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
