import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Home, FileText, CheckSquare, MapPin, Calendar, Check } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BuyerSearchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: search } = await supabase
    .from('buyer_searches')
    .select('*, buyer_offers(*), buyer_checklist_items(*)')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!search) notFound()

  const checklist = search.buyer_checklist_items || []
  const offers = search.buyer_offers || []
  const phases = ['pre_offer', 'under_contract', 'closing', 'post_closing']
  const phaseLabels: Record<string, string> = {
    pre_offer: 'Before Making an Offer',
    under_contract: 'Under Contract',
    closing: 'Closing Process',
    post_closing: 'After Closing',
  }

  const STATUS_COLORS: Record<string, string> = {
    researching: 'bg-blue-400/10 text-blue-400',
    offer_made: 'bg-yellow-400/10 text-yellow-400',
    under_contract: 'bg-green-400/10 text-green-400',
    closed: 'bg-purple-400/10 text-purple-400',
    passed: 'bg-slate-700 text-slate-400',
  }

  const done = checklist.filter((i: any) => i.completed).length
  const total = checklist.length

  return (
    <div>
      <div className="page-header flex items-center gap-4">
        <Link href="/buyer/search" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="page-title mb-0">{search.address}</h1>
            <span className={`badge text-xs capitalize ${STATUS_COLORS[search.status] || 'bg-slate-700 text-slate-400'}`}>
              {search.status.replace('_', ' ')}
            </span>
          </div>
          <p className="page-subtitle">{search.city}, {search.state} {search.zip}</p>
        </div>
        <Link href={`/buyer/offer?search=${search.id}`} className="btn-buyer">
          <FileText className="w-4 h-4" /> Make an offer
        </Link>
      </div>

      {/* KEY DETAILS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Asking Price', value: search.asking_price ? formatCurrency(search.asking_price) : '—', color: 'text-buyer' },
          { label: 'Bedrooms', value: search.bedrooms ? `${search.bedrooms} bd` : '—', color: 'text-slate-200' },
          { label: 'Bathrooms', value: search.bathrooms ? `${search.bathrooms} ba` : '—', color: 'text-slate-200' },
          { label: 'Square Feet', value: search.square_feet ? search.square_feet.toLocaleString() : '—', color: 'text-slate-200' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-slate-500 text-xs">{s.label}</span>
            <p className={`font-display text-2xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHECKLIST */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="section-title mb-0">Checklist</h2>
            <span className="text-sm text-slate-500">{done}/{total} complete</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-buyer rounded-full transition-all" style={{ width:`${total > 0 ? (done/total)*100 : 0}%` }} />
          </div>

          <div className="space-y-4">
            {phases.map(phase => {
              const items = checklist.filter((i: any) => i.phase === phase)
              if (!items.length) return null
              return (
                <div key={phase}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{phaseLabels[phase]}</p>
                  <div className="space-y-1">
                    {items.map((item: any) => (
                      <div key={item.id} className={`flex items-start gap-3 p-3 rounded-xl ${item.completed ? 'opacity-60' : 'hover:bg-slate-800/40'} transition-colors`}>
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 ${item.completed ? 'bg-buyer border-buyer' : 'border-slate-600'}`}>
                          {item.completed && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{item.task}</p>
                          {item.description && <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* OFFERS */}
          <div className="card p-5">
            <h2 className="section-title">My Offers</h2>
            {offers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-slate-500 text-sm mb-3">No offers made yet</p>
                <Link href={`/buyer/offer?search=${search.id}`} className="btn-buyer text-sm w-full justify-center">
                  Generate offer letter
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {offers.map((offer: any) => (
                  <div key={offer.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="font-display text-lg text-buyer">{formatCurrency(offer.offer_amount)}</p>
                      <p className="text-xs text-slate-500">{formatDate(offer.created_at)}</p>
                    </div>
                    <span className={`badge text-xs capitalize ${offer.status === 'accepted' ? 'bg-green-400/10 text-green-400' : offer.status === 'rejected' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                      {offer.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NOTES */}
          {search.notes && (
            <div className="card p-5">
              <h2 className="section-title">Notes</h2>
              <p className="text-slate-400 text-sm leading-relaxed">{search.notes}</p>
            </div>
          )}

          {/* QUICK ACTIONS */}
          <div className="card p-5">
            <h2 className="section-title">Quick Actions</h2>
            <div className="space-y-2">
              <Link href="/buyer/calculator" className="btn-secondary w-full justify-center text-sm">
                Calculate mortgage
              </Link>
              <Link href="/buyer/checklist" className="btn-secondary w-full justify-center text-sm">
                Full buyer guide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
