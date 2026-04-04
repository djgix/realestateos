import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Search, FileText, CheckSquare, Calculator, Plus, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'

const BUYER_PHASES = [
  { id:'pre_offer',      label:'Pre-Offer Research',  desc:'Research the property, neighborhood, and market.' },
  { id:'under_contract', label:'Under Contract',      desc:'Inspection, appraisal, and contingency management.' },
  { id:'closing',        label:'Closing Process',     desc:'Final steps to get the keys.' },
  { id:'post_closing',   label:'After Closing',       desc:'Move in and ownership transfer.' },
]

export default async function BuyerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: searches } = await supabase.from('buyer_searches').select('*, buyer_offers(*), buyer_checklist_items(*)').eq('owner_id', user!.id).order('created_at', { ascending: false })
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()
  const firstName = profile?.full_name?.split(' ')[0] || 'there'

  const activeSearch = searches?.find(s => !['closed','passed'].includes(s.status))

  if (!searches?.length) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">BuyerOS</h1>
          <p className="page-subtitle">Navigate the home buying process with confidence.</p>
        </div>
        <div className="card p-16 text-center">
          <Home className="w-16 h-16 mx-auto mb-6 text-slate-600" />
          <h2 className="font-display text-3xl text-slate-300 mb-3">Let's find your home</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Add a property you're interested in and we'll guide you through making an offer, negotiating, inspection, and closing.</p>
          <Link href="/buyer/search/new" className="btn-buyer inline-flex">
            <Plus className="w-4 h-4" /> Add a property I'm considering
          </Link>
        </div>
      </div>
    )
  }

  const completedItems = activeSearch?.buyer_checklist_items?.filter((i: any) => i.completed).length || 0
  const totalItems = activeSearch?.buyer_checklist_items?.length || 0

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Welcome back, {firstName}</h1>
          <p className="page-subtitle">Your home buying journey</p>
        </div>
        <Link href="/buyer/search/new" className="btn-buyer">
          <Plus className="w-4 h-4" /> Add property
        </Link>
      </div>

      {activeSearch && (
        <div className="card p-6 mb-6 border-buyer/20 bg-buyer/5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-buyer uppercase tracking-wider mb-1">Active Property</p>
              <h2 className="font-display text-2xl text-white">{activeSearch.address}</h2>
              <p className="text-slate-400 text-sm">{activeSearch.city}, {activeSearch.state} · {activeSearch.asking_price ? formatCurrency(activeSearch.asking_price) : 'Price TBD'}</p>
            </div>
            <span className={`badge capitalize ${activeSearch.status === 'under_contract' ? 'bg-green-400/10 text-green-400' : 'bg-buyer/10 text-buyer'}`}>
              {activeSearch.status.replace('_', ' ')}
            </span>
          </div>

          {totalItems > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Checklist progress</p>
                <p className="text-sm text-slate-300">{completedItems}/{totalItems} complete</p>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-buyer rounded-full transition-all"
                  style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Make an Offer', desc:'Generate offer letter', href:'/buyer/offer', icon:FileText, color:'bg-buyer/10 text-buyer' },
          { label:'My Checklist', desc:'Track every step', href:'/buyer/checklist', icon:CheckSquare, color:'bg-green-400/10 text-green-400' },
          { label:'Calculator', desc:'Monthly payment', href:'/buyer/calculator', icon:Calculator, color:'bg-brand-400/10 text-brand-400' },
          { label:'All Properties', desc:'Your tracked homes', href:'/buyer/search', icon:Search, color:'bg-purple-400/10 text-purple-400' },
        ].map(action => (
          <Link key={action.href} href={action.href} className="card p-5 hover:border-slate-700 transition-colors">
            <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center mb-3`}>
              <action.icon className="w-4 h-4" />
            </div>
            <p className="font-semibold text-slate-200 text-sm">{action.label}</p>
            <p className="text-xs text-slate-500">{action.desc}</p>
          </Link>
        ))}
      </div>

      {/* BUYER GUIDES */}
      <div className="card p-6">
        <h2 className="section-title">Buying Guides</h2>
        <div className="space-y-2">
          {[
            { title:'How to Write a Winning Offer', desc:'What to include and what to negotiate', href:'/buyer/offer' },
            { title:'What to Look for in an Inspection', desc:'Red flags and deal breakers', href:'/buyer/checklist' },
            { title:'Understanding Closing Costs', desc:'What you actually owe at closing', href:'/buyer/calculator' },
            { title:'Negotiation Scripts', desc:'Word-for-word what to say after the inspection', href:'/buyer/offer' },
          ].map(guide => (
            <Link key={guide.title} href={guide.href} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800/40 transition-colors">
              <div className="flex-1">
                <p className="font-medium text-slate-200 text-sm">{guide.title}</p>
                <p className="text-xs text-slate-500">{guide.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
