'use client'
import { useState } from 'react'
import { Scale, Search, ChevronDown, ChevronRight, FileText, AlertTriangle, BookOpen, Shield, Download, Info } from 'lucide-react'
import { US_STATES, STATE_LAWS } from '@/lib/utils'

const GUIDES = [
  { category:'Eviction Process', icon:AlertTriangle, color:'text-red-400', bg:'bg-red-400/10', guides:[
    { title:'Non-Payment of Rent', desc:'Step-by-step notice and filing process for non-payment.' },
    { title:'Lease Violation', desc:'Cure or quit notice requirements and timeline.' },
    { title:'Illegal Activity', desc:'Unconditional quit notice process.' },
    { title:'End of Lease', desc:'Holdover eviction when tenant won\'t vacate.' },
  ]},
  { category:'Required Notices', icon:FileText, color:'text-blue-400', bg:'bg-blue-400/10', guides:[
    { title:'3-Day Pay or Quit Notice', desc:'Required before eviction for non-payment.' },
    { title:'30-Day Notice to Vacate', desc:'Ending a month-to-month tenancy.' },
    { title:'Rent Increase Notice', desc:'Required advance notice periods by state.' },
    { title:'Entry Notice', desc:'How much notice before entering the unit.' },
    { title:'Security Deposit Return', desc:'Timeline and documentation requirements.' },
  ]},
  { category:'Tenant Rights & Compliance', icon:Shield, color:'text-green-400', bg:'bg-green-400/10', guides:[
    { title:'Habitability Standards', desc:'What you\'re legally required to maintain.' },
    { title:'Fair Housing Compliance', desc:'Protected classes and screening rules.' },
    { title:'Retaliation Prohibition', desc:'What constitutes illegal retaliation.' },
    { title:'Rent Control Overview', desc:'Which states and cities have rent control.' },
  ]},
  { category:'Financial & Legal', icon:BookOpen, color:'text-brand-400', bg:'bg-brand-400/10', guides:[
    { title:'Security Deposit Rules', desc:'Maximum amounts and deduction rules by state.' },
    { title:'Late Fee Limits', desc:'Maximum late fees by state.' },
    { title:'Small Claims Court', desc:'How to file and win for property damage.' },
    { title:'Tax Deductions', desc:'Every deduction landlords typically miss.' },
  ]},
]

const TEMPLATES = [
  'Pay or Quit Notice', 'Cure or Quit Notice', 'Unconditional Quit Notice',
  'Rent Increase Notice', 'Lease Renewal Offer', 'Entry Notice',
  'Security Deposit Itemization', 'Move-Out Instructions', 'Lease Violation Warning',
  'Late Rent Notice',
]

export default function LegalPage() {
  const [tab, setTab] = useState<'guides'|'state'|'templates'>('guides')
  const [selectedState, setSelectedState] = useState('CA')
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string|null>('Eviction Process')

  const stateLaw = STATE_LAWS[selectedState]
  const filtered = GUIDES.map(cat => ({
    ...cat,
    guides: cat.guides.filter(g => !search || g.title.toLowerCase().includes(search.toLowerCase()) || g.desc.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.guides.length > 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Legal Center</h1>
        <p className="page-subtitle">Plain-English guides, state laws, and notice templates for all 50 states</p>
      </div>

      <div className="mb-6 bg-slate-800/50 border border-slate-700 rounded-2xl p-4 flex gap-3">
        <Scale className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-slate-500 text-sm leading-relaxed">
          <strong className="text-slate-400">Informational only.</strong> LandlordOS provides legal information, not legal advice. For complex situations, consult a licensed attorney in your state.
        </p>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 mb-8 w-fit">
        {[{id:'guides',label:'Legal Guides'},{id:'state',label:'State Laws'},{id:'templates',label:'Notice Templates'}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* GUIDES */}
      {tab === 'guides' && (
        <div>
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search guides..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-11" />
          </div>
          <div className="space-y-3">
            {filtered.map(cat => (
              <div key={cat.category} className="card overflow-hidden">
                <button onClick={() => setExpanded(expanded === cat.category ? null : cat.category)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl ${cat.bg} flex items-center justify-center`}>
                      <cat.icon className={`w-4 h-4 ${cat.color}`} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-200">{cat.category}</p>
                      <p className="text-xs text-slate-500">{cat.guides.length} guides</p>
                    </div>
                  </div>
                  {expanded === cat.category ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </button>
                {expanded === cat.category && (
                  <div className="border-t border-slate-800 divide-y divide-slate-800/50">
                    {cat.guides.map(g => (
                      <div key={g.title} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors cursor-pointer">
                        <div className="flex-1">
                          <p className="font-medium text-slate-200 text-sm">{g.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{g.desc}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STATE LAWS */}
      {tab === 'state' && (
        <div>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium text-slate-400 whitespace-nowrap">Select state:</label>
            <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="select max-w-xs">
              {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
            </select>
          </div>
          {stateLaw ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label:'Pay or Quit Notice Period', value:stateLaw.noticePay, desc:'Before filing for eviction for non-payment', warn:false },
                { label:'Notice to Vacate Period', value:stateLaw.noticeVacate, desc:'To end a month-to-month tenancy', warn:false },
                { label:'Security Deposit Maximum', value:stateLaw.depositMax, desc:'Max deposit you can collect', warn:false },
                { label:'Deposit Return Deadline', value:stateLaw.depositReturn, desc:'Days to return deposit after move-out', warn:false },
                { label:'Entry Notice Required', value:stateLaw.entryNotice, desc:'Notice before entering the unit', warn:false },
                { label:'Maximum Late Fee', value:stateLaw.lateFeeMax, desc:'Maximum late fee allowed', warn:false },
                { label:'Rent Control', value:stateLaw.rentControl ? 'Yes — check local laws' : 'No statewide rent control', desc:'Whether rent control applies', warn:stateLaw.rentControl },
              ].map(item => (
                <div key={item.label} className={`card p-5 ${item.warn ? 'border-yellow-500/20' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                      <p className={`font-semibold text-lg ${item.warn ? 'text-yellow-400' : 'text-slate-200'}`}>{item.value}</p>
                      <p className="text-xs text-slate-600 mt-1">{item.desc}</p>
                    </div>
                    {item.warn && <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Info className="w-8 h-8 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500 text-sm">State law data not yet available for this state. Check your state's official landlord-tenant law resources.</p>
            </div>
          )}
          <p className="text-xs text-slate-600 mt-6 text-center">Laws change frequently. Always verify with your state's official resources or a local attorney.</p>
        </div>
      )}

      {/* TEMPLATES */}
      {tab === 'templates' && (
        <div>
          <p className="text-slate-500 text-sm mb-6">Professional notice templates. Customize with your details and download as PDF.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map(template => (
              <div key={template} className="card p-5 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-landlord" />
                  <h3 className="font-semibold text-slate-200 text-sm">{template}</h3>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center">Customize & Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
