'use client'
import { useState } from 'react'
import { Check, CheckSquare, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

const CHECKLIST = [
  {
    phase: 'Before You Make an Offer',
    icon: '🔍',
    items: [
      { task: 'Get pre-approved for a mortgage', desc: 'Pre-approval strengthens your offer and shows sellers you\'re serious.' },
      { task: 'Research comparable sales (comps)', desc: 'Know what similar homes sold for in the last 6 months.' },
      { task: 'Research the neighborhood', desc: 'Schools, crime, flood zones, future development plans.' },
      { task: 'Check property tax history', desc: 'Available on county assessor website — factor into monthly costs.' },
      { task: 'Drive by at different times of day', desc: 'Traffic, noise, neighbors — things you can\'t see from photos.' },
      { task: 'Check for HOA and its financials', desc: 'Review HOA fees, rules, and reserve fund health.' },
      { task: 'Review seller disclosures carefully', desc: 'Everything the seller is required to tell you about the property.' },
    ]
  },
  {
    phase: 'After Offer Is Accepted',
    icon: '📋',
    items: [
      { task: 'Pay earnest money deposit', desc: 'Usually due within 3 days of acceptance. Goes toward purchase price.' },
      { task: 'Schedule home inspection', desc: 'Hire a licensed inspector within your inspection contingency period.' },
      { task: 'Review inspection report thoroughly', desc: 'Read every page. Ask inspector to explain anything unclear.' },
      { task: 'Negotiate repairs or credits if needed', desc: 'You can request repairs, price reduction, or closing cost credits.' },
      { task: 'Apply for mortgage formally', desc: 'Submit full application to your lender immediately.' },
      { task: 'Order title search', desc: 'Title company will search for liens or ownership issues.' },
      { task: 'Get homeowner\'s insurance quotes', desc: 'Required by lender. Shop 3+ companies for best rate.' },
      { task: 'Review appraisal', desc: 'If appraisal comes in low, you can renegotiate or walk away.' },
    ]
  },
  {
    phase: '1–2 Weeks Before Closing',
    icon: '📅',
    items: [
      { task: 'Review Closing Disclosure', desc: 'Must be provided 3 business days before closing. Compare to Loan Estimate.' },
      { task: 'Wire closing funds', desc: 'Call title company to verify wire instructions — never email only.' },
      { task: 'Purchase homeowner\'s insurance', desc: 'Have proof of insurance ready for closing.' },
      { task: 'Notify utility companies', desc: 'Schedule transfer of electric, gas, water, and internet.' },
      { task: 'Schedule movers', desc: 'Book early — good movers fill up fast.' },
      { task: 'Do a final walkthrough', desc: 'Usually 24–48 hours before closing. Confirm agreed repairs are done.' },
    ]
  },
  {
    phase: 'Closing Day',
    icon: '🔑',
    items: [
      { task: 'Bring government-issued photo ID', desc: 'Required to sign documents.' },
      { task: 'Confirm wire transfer sent', desc: 'Confirm with your bank that the wire was received.' },
      { task: 'Sign all closing documents', desc: 'You\'ll sign a lot of paperwork. Read each one, ask questions.' },
      { task: 'Get keys and garage remotes', desc: 'Also get mailbox keys, gate codes, and any manuals.' },
      { task: 'Take possession of the property', desc: 'Congratulations — you own it!' },
    ]
  },
  {
    phase: 'After Closing',
    icon: '🏠',
    items: [
      { task: 'Change all locks', desc: 'You don\'t know who has copies of the old keys.' },
      { task: 'File for homestead exemption', desc: 'Many states offer property tax reduction for primary residence. Apply ASAP.' },
      { task: 'Update address everywhere', desc: 'Bank, IRS, DMV, USPS, employer, subscriptions.' },
      { task: 'Store closing documents safely', desc: 'Keep for at least 7 years. Include in a fireproof safe or cloud backup.' },
      { task: 'Set up a home maintenance fund', desc: 'Budget 1–2% of home value per year for maintenance.' },
    ]
  },
]

export default function BuyerChecklistPage() {
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['Before You Make an Offer']))

  function toggle(key: string) {
    setCompleted(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function togglePhase(phase: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(phase)) next.delete(phase)
      else next.add(phase)
      return next
    })
  }

  const totalItems = CHECKLIST.reduce((s, p) => s + p.items.length, 0)
  const doneItems = completed.size

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Buyer Checklist</h1>
        <p className="page-subtitle">Every step of the home buying process</p>
      </div>

      {/* Progress */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="font-medium text-slate-200">Overall Progress</p>
          <p className="text-slate-400 text-sm">{doneItems} of {totalItems} complete</p>
        </div>
        <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-buyer rounded-full transition-all duration-500"
            style={{ width:`${(doneItems/totalItems)*100}%` }} />
        </div>
        <p className="text-xs text-slate-500 mt-2">{Math.round((doneItems/totalItems)*100)}% complete</p>
      </div>

      <div className="space-y-4">
        {CHECKLIST.map(phase => {
          const phaseKeys = phase.items.map((_, i) => `${phase.phase}-${i}`)
          const phaseDone = phaseKeys.filter(k => completed.has(k)).length
          const isExpanded = expanded.has(phase.phase)

          return (
            <div key={phase.phase} className="card overflow-hidden">
              <button
                onClick={() => togglePhase(phase.phase)}
                className="w-full flex items-center gap-4 p-5 hover:bg-slate-800/40 transition-colors text-left"
              >
                <span className="text-2xl">{phase.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-200">{phase.phase}</p>
                  <p className="text-xs text-slate-500">{phaseDone}/{phase.items.length} complete</p>
                </div>
                <div className="flex items-center gap-3">
                  {phaseDone === phase.items.length && (
                    <span className="badge bg-green-400/10 text-green-400 text-xs">Done</span>
                  )}
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-slate-500" />
                    : <ChevronRight className="w-4 h-4 text-slate-500" />
                  }
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800 divide-y divide-slate-800/50">
                  {phase.items.map((item, i) => {
                    const key = `${phase.phase}-${i}`
                    const done = completed.has(key)
                    return (
                      <div
                        key={i}
                        onClick={() => toggle(key)}
                        className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors ${done ? 'opacity-60 hover:opacity-80' : 'hover:bg-slate-800/30'}`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${done ? 'bg-buyer border-buyer' : 'border-slate-600'}`}>
                          {done && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${done ? 'line-through text-slate-500' : 'text-slate-200'}`}>{item.task}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="card p-5 mt-6 border-blue-400/20 bg-blue-400/5 flex gap-3">
        <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="text-blue-300 text-sm">This checklist is general guidance. Real estate processes vary by state and situation. For complex transactions, consult a real estate attorney.</p>
      </div>
    </div>
  )
}
