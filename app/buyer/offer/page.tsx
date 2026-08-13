'use client'
import { useState } from 'react'
import { FileText, ArrowLeft, ArrowRight, Check, Download, AlertCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const STEPS = ['Property Details', 'Offer Terms', 'Contingencies', 'Cover Letter', 'Review & Download']

const CONTINGENCY_OPTIONS = [
  { id: 'inspection', label: 'Inspection Contingency', desc: 'Right to inspect and back out if issues found', recommended: true },
  { id: 'financing', label: 'Financing Contingency', desc: 'Protects you if your loan falls through', recommended: true },
  { id: 'appraisal', label: 'Appraisal Contingency', desc: 'Protects you if home appraises below offer price', recommended: true },
  { id: 'sale', label: 'Home Sale Contingency', desc: 'Offer contingent on selling your current home', recommended: false },
  { id: 'title', label: 'Clear Title Contingency', desc: 'Sale contingent on clear title', recommended: false },
]

export default function BuyerOfferPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    address: '', city: '', state: '', zip: '', askingPrice: '',
    offerAmount: '', earnestMoney: '', downPaymentPct: '20',
    financingType: 'conventional', closingDate: '', inspectionDays: '10',
    escalation: false, escalationCap: '', escalationIncrement: '',
    contingencies: ['inspection', 'financing', 'appraisal'],
    coverLetter: '', buyerName: '', buyerEmail: '',
  })

  function update(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  function toggleContingency(id: string) {
    setForm(prev => ({
      ...prev,
      contingencies: prev.contingencies.includes(id)
        ? prev.contingencies.filter(c => c !== id)
        : [...prev.contingencies, id]
    }))
  }

  const offerNum = parseFloat(form.offerAmount) || 0
  const askNum = parseFloat(form.askingPrice) || 0
  const diff = offerNum - askNum
  const diffPct = askNum > 0 ? ((diff / askNum) * 100).toFixed(1) : '0'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header flex items-center gap-4">
        <h1 className="page-title">Generate Offer Letter</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-shrink-0">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${i === step ? 'bg-buyer text-white' : i < step ? 'bg-green-400/10 text-green-400' : 'bg-slate-800 text-slate-500'}`}>
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              {s}
            </div>
            {i < STEPS.length - 1 && <div className={`w-4 h-px ${i < step ? 'bg-green-400' : 'bg-slate-700'}`} />}
          </div>
        ))}
      </div>

      <div className="card p-8">

        {/* STEP 0 — Property */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Property Details</h2>
            <div className="form-group">
              <label className="label">Property Address</label>
              <input type="text" className="input" placeholder="123 Main Street" value={form.address} onChange={e => update('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="form-group col-span-2">
                <label className="label">City</label>
                <input type="text" className="input" value={form.city} onChange={e => update('city', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">State</label>
                <input type="text" className="input" maxLength={2} placeholder="CA" value={form.state} onChange={e => update('state', e.target.value.toUpperCase())} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Asking Price</label>
              <input type="number" className="input" placeholder="400000" value={form.askingPrice} onChange={e => update('askingPrice', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Your Name</label>
              <input type="text" className="input" value={form.buyerName} onChange={e => update('buyerName', e.target.value)} />
            </div>
          </div>
        )}

        {/* STEP 1 — Offer Terms */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Offer Terms</h2>
            <div className="form-group">
              <label className="label">Your Offer Amount</label>
              <input type="number" className="input" placeholder="395000" value={form.offerAmount} onChange={e => update('offerAmount', e.target.value)} />
              {offerNum > 0 && askNum > 0 && (
                <p className={`text-xs mt-1.5 ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({diffPct}% {diff >= 0 ? 'over' : 'under'} asking)
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Earnest Money</label>
                <input type="number" className="input" placeholder="5000" value={form.earnestMoney} onChange={e => update('earnestMoney', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Down Payment %</label>
                <input type="number" className="input" min="3" max="100" value={form.downPaymentPct} onChange={e => update('downPaymentPct', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Financing Type</label>
              <select className="select" value={form.financingType} onChange={e => update('financingType', e.target.value)}>
                <option value="conventional">Conventional</option>
                <option value="fha">FHA</option>
                <option value="va">VA</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Desired Closing Date</label>
                <input type="date" className="input" value={form.closingDate} onChange={e => update('closingDate', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Inspection Period (days)</label>
                <input type="number" className="input" value={form.inspectionDays} onChange={e => update('inspectionDays', e.target.value)} />
              </div>
            </div>

            {/* Escalation */}
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input type="checkbox" checked={form.escalation} onChange={e => update('escalation', e.target.checked)} className="w-4 h-4 accent-buyer" />
                <div>
                  <p className="text-sm font-medium text-slate-200">Add Escalation Clause</p>
                  <p className="text-xs text-slate-500">Automatically beat competing offers up to a cap</p>
                </div>
              </label>
              {form.escalation && (
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="form-group">
                      <label className="label">Beat competing offers by</label>
                      <input type="number" min="0.01" step="0.01" className="input" placeholder="2000" value={form.escalationIncrement} onChange={e => update('escalationIncrement', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="label">Maximum cap</label>
                      <input type="number" min="0.01" step="0.01" className="input" placeholder="420000" value={form.escalationCap} onChange={e => update('escalationCap', e.target.value)} />
                    </div>
                  </div>
                  {!(parseFloat(form.escalationIncrement) > 0 && parseFloat(form.escalationCap) > 0) && (
                    <p className="text-xs text-yellow-400/80 mt-2">Enter both values to include the escalation clause in your letter.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2 — Contingencies */}
        {step === 2 && (
          <div>
            <h2 className="font-display text-2xl text-slate-100 mb-2">Contingencies</h2>
            <p className="text-slate-500 text-sm mb-6">Contingencies protect you but can weaken your offer. Remove carefully in competitive markets.</p>
            <div className="space-y-3">
              {CONTINGENCY_OPTIONS.map(c => (
                <label key={c.id} className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${form.contingencies.includes(c.id) ? 'border-buyer/40 bg-buyer/5' : 'border-slate-700 hover:border-slate-600'}`}>
                  <input type="checkbox" checked={form.contingencies.includes(c.id)} onChange={() => toggleContingency(c.id)} className="w-4 h-4 accent-buyer mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-slate-200">{c.label}</p>
                      {c.recommended && <span className="badge bg-green-400/10 text-green-400 text-xs">Recommended</span>}
                    </div>
                    <p className="text-xs text-slate-500">{c.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="mt-4 p-4 bg-yellow-400/5 border border-yellow-400/20 rounded-xl flex gap-3">
              <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-xs">Removing contingencies strengthens your offer but increases risk. Never waive an inspection contingency without fully understanding the property's condition.</p>
            </div>
          </div>
        )}

        {/* STEP 3 — Cover Letter */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl text-slate-100 mb-2">Personal Cover Letter</h2>
            <p className="text-slate-500 text-sm mb-6">A heartfelt letter can tip the scales in your favor when offers are close. Tell the seller why you love their home.</p>
            <div className="form-group">
              <label className="label">Your letter (optional but powerful)</label>
              <p className="text-xs text-slate-600 mb-2">
                Just write the body — a greeting and your signature are added automatically in the generated letter.
              </p>
              <textarea rows={10} className="textarea" placeholder={`My name is ${form.buyerName || '[Your Name]'} and I am writing to express my sincere interest in your home at ${form.address || '[address]'}.

[Tell them why you love the home, what you plan to do with it, and why you'd be the ideal buyer. Keep it genuine and personal — 3–4 paragraphs works best.]`}
                value={form.coverLetter}
                onChange={e => update('coverLetter', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* STEP 4 — Review */}
        {step === 4 && (
          <div>
            <h2 className="font-display text-2xl text-slate-100 mb-6">Review Your Offer</h2>
            <div className="space-y-4 mb-8">
              {[
                { label: 'Property', value: `${form.address}, ${form.city}, ${form.state}` },
                { label: 'Offer Amount', value: formatCurrency(offerNum), highlight: true },
                { label: 'Earnest Money', value: form.earnestMoney ? formatCurrency(parseFloat(form.earnestMoney)) : '—' },
                { label: 'Down Payment', value: `${form.downPaymentPct}%` },
                { label: 'Financing', value: form.financingType.toUpperCase() },
                { label: 'Closing Date', value: form.closingDate || '—' },
                { label: 'Inspection Period', value: `${form.inspectionDays} days` },
                { label: 'Contingencies', value: form.contingencies.join(', ') || 'None' },
                { label: 'Escalation', value: form.escalation ? `Up to ${formatCurrency(parseFloat(form.escalationCap))}` : 'No' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-3 border-b border-slate-800 last:border-0">
                  <span className="text-slate-500 text-sm">{item.label}</span>
                  <span className={`text-sm font-medium ${item.highlight ? 'text-buyer font-display text-xl' : 'text-slate-200'}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <button onClick={() => window.print()} className="btn-buyer w-full justify-center py-4 text-base">
              <Download className="w-5 h-5" /> Generate & Download Offer Letter PDF
            </button>
            <p className="text-center text-xs text-slate-500 mt-3">
              This generates a professional offer letter. Have a real estate attorney review before submitting if you have any concerns.
            </p>

            {/* Print-only offer letter — hidden on screen, isolated on print via #printable-offer-letter */}
            <div className="hidden print:block bg-white text-black p-10" id="printable-offer-letter">
              <style dangerouslySetInnerHTML={{__html: `
                @media print {
                  body * { visibility: hidden; }
                  #printable-offer-letter, #printable-offer-letter * { visibility: visible; }
                  #printable-offer-letter { position: absolute; left: 0; top: 0; width: 100%; }
                }
              `}} />
              <p style={{marginBottom: '24px'}}>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p style={{marginBottom: '16px'}}>Re: Offer to Purchase — {form.address || '[Property Address]'}, {form.city}, {form.state}</p>
              <p style={{marginBottom: '16px'}}>Dear Seller,</p>
              {/* The step-3 field only collects the letter's body (its label and
                  placeholder say so explicitly) — the greeting and signature below are
                  always generated so there's exactly one of each, regardless of what
                  the buyer types. */}
              <p style={{whiteSpace: 'pre-wrap', marginBottom: '16px'}}>
                {form.coverLetter || `I am writing to formally present an offer of ${formatCurrency(offerNum)} for your property at ${form.address}, ${form.city}, ${form.state}.`}
              </p>
              <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '24px'}}>
                <tbody>
                  {[
                    ['Offer Amount', formatCurrency(offerNum)],
                    ['Earnest Money', form.earnestMoney ? formatCurrency(parseFloat(form.earnestMoney)) : '—'],
                    ['Down Payment', `${form.downPaymentPct}%`],
                    ['Financing', form.financingType.toUpperCase()],
                    ['Closing Date', form.closingDate || '—'],
                    ['Inspection Period', `${form.inspectionDays} days`],
                    ['Contingencies', form.contingencies.join(', ') || 'None'],
                    ...(form.escalation && parseFloat(form.escalationIncrement) > 0 && parseFloat(form.escalationCap) > 0
                      ? [['Escalation Clause', `Beats competing offers by ${formatCurrency(parseFloat(form.escalationIncrement))}, up to ${formatCurrency(parseFloat(form.escalationCap))}`]]
                      : []),
                  ].map(([label, value]) => (
                    <tr key={label} style={{borderBottom: '1px solid #ddd'}}>
                      <td style={{padding: '8px 0', fontWeight: 600}}>{label}</td>
                      <td style={{padding: '8px 0', textAlign: 'right'}}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{marginBottom: '8px'}}>Thank you for considering my offer.</p>
              <p style={{marginBottom: '48px'}}>Sincerely,</p>
              <p>{form.buyerName || '[Your Name]'}</p>
              {form.buyerEmail && <p>{form.buyerEmail}</p>}
            </div>
          </div>
        )}

        {/* NAV BUTTONS */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={step === 1 && form.escalation && !(parseFloat(form.escalationIncrement) > 0 && parseFloat(form.escalationCap) > 0)}
              className="btn-buyer disabled:opacity-50"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
