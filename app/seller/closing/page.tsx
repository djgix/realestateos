import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { CheckSquare, Clock, AlertCircle, Check, Plus } from 'lucide-react'

const DEFAULT_TASKS = [
  { phase: 'Under Contract', tasks: [
    'Order title search and title insurance',
    'Respond to inspection repair requests within deadline',
    'Provide any documents requested by buyer\'s lender',
    'Complete agreed-upon repairs before closing',
    'Notify utility companies of transfer date',
    'Schedule final walkthrough with buyer',
  ]},
  { phase: 'Week Before Closing', tasks: [
    'Confirm closing date, time, and location with title company',
    'Review closing disclosure — compare to loan estimate',
    'Confirm wire transfer instructions directly with title company',
    'Gather all keys, garage remotes, and access codes',
    'Cancel homeowner\'s insurance effective day after closing',
    'Forward mail to new address',
  ]},
  { phase: 'Closing Day', tasks: [
    'Bring valid government-issued photo ID',
    'Complete final walkthrough of property',
    'Sign all closing documents',
    'Hand over keys, garage remotes, manuals, and warranties',
    'Confirm wire transfer received',
    'Celebrate — you just saved thousands in commission!',
  ]},
  { phase: 'After Closing', tasks: [
    'Keep copies of all closing documents for 7+ years',
    'Report sale to accountant — capital gains may apply',
    'Cancel any remaining home services (lawn, pest, etc.)',
    'Update your address with banks, IRS, and DMV',
  ]},
]

export default async function SellerClosingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: listings } = await supabase
    .from('seller_listings')
    .select('id, address, closing_date, status')
    .eq('owner_id', user!.id)
    .eq('status', 'under_contract')
    .limit(1)

  const activeListing = listings?.[0]
  const completed: Record<string, boolean> = {}

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Closing</h1>
        <p className="page-subtitle">
          {activeListing
            ? `${activeListing.address} · Closing ${activeListing.closing_date ? formatDate(activeListing.closing_date) : 'TBD'}`
            : 'Your closing checklist and timeline'}
        </p>
      </div>

      {!activeListing && (
        <div className="card p-5 border-blue-400/20 bg-blue-400/5 flex gap-3 mb-6">
          <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-blue-300 text-sm">This checklist will activate once you have an accepted offer and your listing is marked under contract.</p>
        </div>
      )}

      <div className="space-y-6">
        {DEFAULT_TASKS.map((phase, pi) => (
          <div key={phase.phase}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 rounded-full bg-seller flex items-center justify-center text-white text-xs font-bold">{pi + 1}</div>
              <h2 className="font-semibold text-slate-200">{phase.phase}</h2>
            </div>
            <div className="card divide-y divide-slate-800/50 overflow-hidden">
              {phase.tasks.map((task, ti) => {
                const key = `${pi}-${ti}`
                const done = completed[key]
                return (
                  <div key={ti} className={`flex items-center gap-4 px-5 py-4 transition-colors ${done ? 'opacity-60' : 'hover:bg-slate-800/30'}`}>
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${done ? 'bg-seller border-seller' : 'border-slate-600 hover:border-seller'}`}>
                      {done && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <p className={`text-sm flex-1 ${done ? 'line-through text-slate-500' : 'text-slate-300'}`}>{task}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card p-6 mt-8 bg-seller/5 border-seller/20">
        <h2 className="section-title">Important Warnings</h2>
        <div className="space-y-3">
          {[
            'Never wire funds based on email instructions alone — always call the title company directly to verify wire details. Wire fraud is common.',
            'Capital gains tax may apply on profit over $250,000 (single) or $500,000 (married) if you lived in the home for 2 of the last 5 years.',
            'Keep all closing documents for at least 7 years in case of IRS audit.',
          ].map((warning, i) => (
            <div key={i} className="flex gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-400 text-sm">{warning}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
