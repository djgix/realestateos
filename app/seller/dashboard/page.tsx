import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Home, DollarSign, FileText, CheckSquare, ArrowRight, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

const SELLER_STEPS = [
  { id:'prep',             label:'Prepare Your Home',      desc:'Clean, repair, stage, and photograph your property.' },
  { id:'disclosures',      label:'Complete Disclosures',   desc:'Generate required state disclosure documents.' },
  { id:'list',             label:'List Your Property',     desc:'Get on Zillow, Realtor.com, and MLS.' },
  { id:'showings',         label:'Schedule Showings',      desc:'Track showing requests and feedback.' },
  { id:'offers',           label:'Review Offers',          desc:'Analyze and negotiate incoming offers.' },
  { id:'under_contract',   label:'Under Contract',         desc:'Inspection period and contingency management.' },
  { id:'closing',          label:'Close the Sale',         desc:'Final walkthrough, paperwork, and keys.' },
]

export default async function SellerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: listings } = await supabase.from('seller_listings').select('*, seller_offers(*)').eq('owner_id', user!.id).order('created_at', { ascending: false })
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const activeListing = listings?.[0]
  const offers = activeListing?.seller_offers || []
  const currentStepIndex = SELLER_STEPS.findIndex(s => s.id === activeListing?.current_step) || 0
  const commissionSaved = activeListing?.asking_price ? activeListing.asking_price * 0.06 : 0

  if (!activeListing) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">SellerOS</h1>
          <p className="page-subtitle">Sell your home without an agent. Keep the commission.</p>
        </div>
        <div className="card p-16 text-center">
          <Home className="w-16 h-16 mx-auto mb-6 text-slate-600" />
          <h2 className="font-display text-3xl text-slate-300 mb-3">Let's sell your home</h2>
          <p className="text-slate-500 mb-4 max-w-md mx-auto">The average agent commission is 5–6%. On a $400,000 home that's $24,000. SellerOS guides you through every step for $299.</p>
          <p className="text-2xl font-display text-seller mb-8">You keep the $24,000.</p>
          <Link href="/seller/listing/new" className="btn-seller inline-flex">
            <Plus className="w-4 h-4" /> Start my listing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">SellerOS</h1>
          <p className="page-subtitle">{activeListing.address}, {activeListing.city}, {activeListing.state}</p>
        </div>
        <Link href="/seller/listing" className="btn-seller">View listing</Link>
      </div>

      {/* KEY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Asking Price', value: formatCurrency(activeListing.asking_price), icon:DollarSign, color:'text-seller' },
          { label:'Commission Saved', value: formatCurrency(commissionSaved), icon:TrendingUp, color:'text-green-400' },
          { label:'Offers Received', value: offers.length, icon:FileText, color:'text-blue-400' },
          { label:'Current Step', value: `${currentStepIndex + 1} of ${SELLER_STEPS.length}`, icon:CheckSquare, color:'text-brand-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className={`font-display text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* PROGRESS */}
      <div className="card p-6 mb-6">
        <h2 className="section-title">Sale Progress</h2>
        <div className="space-y-2">
          {SELLER_STEPS.map((step, i) => {
            const done = i < currentStepIndex
            const current = i === currentStepIndex
            return (
              <div key={step.id} className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${current ? 'bg-seller/10 border border-seller/20' : 'hover:bg-slate-800/40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${done ? 'bg-green-400 text-slate-900' : current ? 'bg-seller text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {done ? '✓' : i + 1}
                </div>
                <div className="flex-1">
                  <p className={`font-medium text-sm ${current ? 'text-seller' : done ? 'text-slate-400' : 'text-slate-300'}`}>{step.label}</p>
                  <p className="text-xs text-slate-500">{step.desc}</p>
                </div>
                {current && <span className="badge bg-seller/10 text-seller text-xs">Current</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* RECENT OFFERS */}
      {offers.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">Offers Received</h2>
            <Link href="/seller/offers" className="text-seller hover:text-green-300 text-sm">View all</Link>
          </div>
          <div className="space-y-2">
            {offers.slice(0, 3).map((offer: any) => (
              <div key={offer.id} className="flex items-center justify-between px-4 py-3 bg-slate-800/50 rounded-xl">
                <div>
                  <p className="font-medium text-slate-200 text-sm">{offer.buyer_name}</p>
                  <p className="text-xs text-slate-500">{offer.financing_type} · {offer.closing_date_requested}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl text-seller">{formatCurrency(offer.offer_amount)}</p>
                  <span className={`badge text-xs ${offer.status === 'accepted' ? 'bg-green-400/10 text-green-400' : offer.status === 'rejected' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                    {offer.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
