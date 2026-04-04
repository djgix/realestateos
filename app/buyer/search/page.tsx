import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Plus, MapPin, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

export default async function BuyerSearchPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: searches } = await supabase
    .from('buyer_searches')
    .select('*, buyer_offers(id), buyer_checklist_items(id, completed)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    researching:    { label: 'Researching',    color: 'bg-blue-400/10 text-blue-400' },
    offer_made:     { label: 'Offer Made',     color: 'bg-yellow-400/10 text-yellow-400' },
    under_contract: { label: 'Under Contract', color: 'bg-green-400/10 text-green-400' },
    closed:         { label: 'Closed',         color: 'bg-purple-400/10 text-purple-400' },
    passed:         { label: 'Passed',         color: 'bg-slate-700 text-slate-400' },
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">{searches?.length || 0} properties you're tracking</p>
        </div>
        <Link href="/buyer/search/new" className="btn-buyer">
          <Plus className="w-4 h-4" /> Add property
        </Link>
      </div>

      {!searches?.length ? (
        <div className="card p-16 text-center">
          <Home className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-display text-2xl text-slate-300 mb-2">No properties tracked yet</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">Add a home you're interested in and BuyerOS will guide you through the entire purchase process.</p>
          <Link href="/buyer/search/new" className="btn-buyer inline-flex">
            <Plus className="w-4 h-4" /> Add first property
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map((s: any) => {
            const config = STATUS_CONFIG[s.status] || STATUS_CONFIG.researching
            const offers = s.buyer_offers?.length || 0
            const checklist = s.buyer_checklist_items || []
            const done = checklist.filter((i: any) => i.completed).length
            const total = checklist.length
            return (
              <Link key={s.id} href={`/buyer/search/${s.id}`}
                className="card p-6 flex items-center gap-6 hover:border-slate-700 transition-all group">
                <div className="w-12 h-12 bg-buyer/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-buyer" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`badge text-xs ${config.color}`}>{config.label}</span>
                    {offers > 0 && <span className="badge bg-brand-400/10 text-brand-400 text-xs">{offers} offer{offers > 1 ? 's' : ''}</span>}
                  </div>
                  <h3 className="font-semibold text-slate-200 mb-1">{s.address || 'Address TBD'}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    {s.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.city}, {s.state}</span>}
                    {s.asking_price && <span>{formatCurrency(s.asking_price)}</span>}
                    <span>Added {formatDate(s.created_at)}</span>
                  </div>
                  {total > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                        <span>Checklist</span>
                        <span>{done}/{total}</span>
                      </div>
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-buyer rounded-full" style={{ width:`${(done/total)*100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 flex-shrink-0 group-hover:text-slate-400 transition-colors" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
