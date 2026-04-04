'use client'
import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Calculator, Info } from 'lucide-react'

export default function CalculatorPage() {
  const [values, setValues] = useState({
    homePrice: 400000,
    downPaymentPct: 20,
    interestRate: 7.1,
    loanTerm: 30,
    propertyTax: 5000,
    insurance: 1800,
    hoa: 0,
    pmi: 0.5,
  })

  const calc = useMemo(() => {
    const loanAmount = values.homePrice * (1 - values.downPaymentPct / 100)
    const monthlyRate = values.interestRate / 100 / 12
    const n = values.loanTerm * 12
    const principal = monthlyRate > 0
      ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
      : loanAmount / n
    const tax = values.propertyTax / 12
    const ins = values.insurance / 12
    const pmi = values.downPaymentPct < 20 ? (loanAmount * (values.pmi / 100)) / 12 : 0
    const total = principal + tax + ins + values.hoa + pmi
    const closingCosts = values.homePrice * 0.03
    const downPayment = values.homePrice * (values.downPaymentPct / 100)
    return { principal, tax, ins, pmi, total, closingCosts, downPayment, loanAmount, totalUpfront: downPayment + closingCosts }
  }, [values])

  function update(key: string, value: number) {
    setValues(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Mortgage Calculator</h1>
        <p className="page-subtitle">Understand exactly what you'll pay before you make an offer.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* INPUTS */}
        <div className="card p-6">
          <h2 className="section-title">Loan Details</h2>
          <div className="space-y-5">
            {[
              { label:'Home Price', key:'homePrice', min:50000, max:5000000, step:5000, prefix:'$', format:true },
              { label:`Down Payment (${values.downPaymentPct}%)`, key:'downPaymentPct', min:3, max:50, step:1, suffix:'%' },
              { label:'Interest Rate', key:'interestRate', min:2, max:12, step:0.1, suffix:'%' },
              { label:'Loan Term', key:'loanTerm', min:10, max:30, step:5, suffix:' yrs', options:[10,15,20,25,30] },
              { label:'Annual Property Tax', key:'propertyTax', min:0, max:50000, step:100, prefix:'$', format:true },
              { label:'Annual Insurance', key:'insurance', min:0, max:20000, step:100, prefix:'$', format:true },
              { label:'HOA (monthly)', key:'hoa', min:0, max:2000, step:25, prefix:'$', format:true },
            ].map(field => (
              <div key={field.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">{field.label}</label>
                  <span className="text-sm font-medium text-slate-200">
                    {field.prefix || ''}{field.format ? Math.round(values[field.key as keyof typeof values]).toLocaleString() : values[field.key as keyof typeof values]}{field.suffix || ''}
                  </span>
                </div>
                {field.options ? (
                  <div className="flex gap-2">
                    {field.options.map(opt => (
                      <button key={opt} onClick={() => update(field.key, opt)}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${values[field.key as keyof typeof values] === opt ? 'bg-buyer text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                        {opt}yr
                      </button>
                    ))}
                  </div>
                ) : (
                  <input type="range" min={field.min} max={field.max} step={field.step}
                    value={values[field.key as keyof typeof values]}
                    onChange={e => update(field.key, parseFloat(e.target.value))}
                    className="w-full accent-buyer" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RESULTS */}
        <div className="space-y-4">
          {/* MONTHLY BREAKDOWN */}
          <div className="card p-6">
            <h2 className="section-title">Monthly Payment</h2>
            <div className="text-center py-4 mb-6 bg-buyer/5 rounded-2xl border border-buyer/20">
              <p className="text-slate-500 text-sm mb-1">Total monthly payment</p>
              <p className="font-display text-5xl text-buyer">{formatCurrency(calc.total)}</p>
            </div>
            <div className="space-y-3">
              {[
                { label:'Principal & Interest', value: calc.principal, color:'bg-buyer' },
                { label:'Property Tax', value: calc.tax, color:'bg-orange-400' },
                { label:'Homeowner\'s Insurance', value: calc.ins, color:'bg-green-400' },
                { label:'HOA', value: values.hoa, color:'bg-purple-400' },
                ...(values.downPaymentPct < 20 ? [{ label:'PMI', value: calc.pmi, color:'bg-red-400' }] : []),
              ].filter(i => i.value > 0).map(item => (
                <div key={item.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-slate-400">{item.label}</span>
                    <span className="text-sm font-medium text-slate-200">{formatCurrency(item.value)}/mo</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width:`${(item.value / calc.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* UPFRONT COSTS */}
          <div className="card p-6">
            <h2 className="section-title">Upfront Costs</h2>
            <div className="space-y-3">
              {[
                { label:'Down Payment', value: calc.downPayment, pct:`${values.downPaymentPct}%` },
                { label:'Estimated Closing Costs', value: calc.closingCosts, pct:'~3%' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.pct} of purchase price</p>
                  </div>
                  <p className="font-display text-xl text-slate-200">{formatCurrency(item.value)}</p>
                </div>
              ))}
              <div className="flex items-center justify-between p-4 bg-buyer/10 border border-buyer/20 rounded-xl">
                <p className="font-semibold text-slate-200">Total Cash Needed</p>
                <p className="font-display text-2xl text-buyer">{formatCurrency(calc.totalUpfront)}</p>
              </div>
            </div>
          </div>

          {/* PMI WARNING */}
          {values.downPaymentPct < 20 && (
            <div className="card p-4 border-yellow-400/20 bg-yellow-400/5 flex gap-3">
              <Info className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-300 text-sm">With less than 20% down you'll pay PMI (~{formatCurrency(calc.pmi)}/mo) until you reach 20% equity. Consider waiting or putting more down to avoid this.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
