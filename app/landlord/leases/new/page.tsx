'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, Check, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { US_STATES } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = ['Property & Tenant', 'Lease Terms', 'Rent & Fees', 'Rules & Clauses', 'Review & Generate']

function NewLeaseContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])

  const [form, setForm] = useState({
    property_id: params.get('property') || '',
    tenant_id: '', state: 'CA',
    start_date: '', end_date: '',
    lease_type: 'fixed', monthly_rent: '',
    security_deposit: '', late_fee: '50', late_fee_days: '5',
    rent_due_day: '1', notes: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: props }, { data: tens }] = await Promise.all([
        supabase.from('properties').select('id, name, state').eq('owner_id', user!.id),
        supabase.from('tenants').select('id, first_name, last_name').eq('owner_id', user!.id).in('status', ['applicant', 'active']),
      ])
      setProperties(props || [])
      setTenants(tens || [])
      if (props?.length && !form.property_id) {
        const p = props[0]
        setForm(f => ({ ...f, property_id: p.id, state: p.state }))
      }
    }
    load()
  }, [])

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function handlePropertyChange(pid: string) {
    const prop = properties.find(p => p.id === pid)
    setForm(f => ({ ...f, property_id: pid, state: prop?.state || f.state }))
  }

  async function handleSubmit() {
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('leases').insert({
      owner_id: user!.id,
      property_id: form.property_id,
      tenant_id: form.tenant_id,
      state: form.state,
      start_date: form.start_date,
      end_date: form.end_date,
      lease_type: form.lease_type,
      monthly_rent: Number(form.monthly_rent),
      security_deposit: Number(form.security_deposit),
      late_fee: Number(form.late_fee),
      late_fee_days: Number(form.late_fee_days),
      rent_due_day: Number(form.rent_due_day),
      status: 'draft',
      notes: form.notes || null,
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false) }
    else {
      // Update tenant status to active
      await supabase.from('tenants').update({ status: 'active', property_id: form.property_id }).eq('id', form.tenant_id)
      toast.success('Lease generated!')
      router.push(`/landlord/leases/${data!.id}`)
    }
  }

  const selectedProperty = properties.find(p => p.id === form.property_id)
  const selectedTenant = tenants.find(t => t.id === form.tenant_id)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header flex items-center gap-4">
        <Link href="/landlord/leases" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Generate Lease</h1>
          <p className="page-subtitle">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= step ? 'bg-landlord' : 'bg-slate-800'}`} />
        ))}
      </div>

      <div className="card p-8">
        {/* STEP 0 - Property & Tenant */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Which property and tenant?</h2>
            <div className="form-group">
              <label className="label">Property *</label>
              <select value={form.property_id} onChange={e => handlePropertyChange(e.target.value)} className="select" required>
                <option value="">Select property...</option>
                {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Tenant *</label>
              <select value={form.tenant_id} onChange={e => set('tenant_id', e.target.value)} className="select" required>
                <option value="">Select tenant...</option>
                {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">Don't see them? <Link href="/landlord/tenants/new" className="text-landlord">Add a tenant first</Link></p>
            </div>
            <div className="form-group">
              <label className="label">State *</label>
              <select value={form.state} onChange={e => set('state', e.target.value)} className="select">
                {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
              <p className="text-xs text-slate-500 mt-1">Lease terms will be adjusted for {US_STATES.find(s => s.code === form.state)?.name} law</p>
            </div>
          </div>
        )}

        {/* STEP 1 - Lease Terms */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-slate-100 mb-6">What are the lease terms?</h2>
            <div className="form-group">
              <label className="label">Lease Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value:'fixed', label:'Fixed Term', desc:'Set start and end date' },
                  { value:'month_to_month', label:'Month-to-Month', desc:'Continues until notice given' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => set('lease_type', opt.value)}
                    className={`p-4 rounded-xl border text-left transition-all ${form.lease_type === opt.value ? 'border-landlord/40 bg-landlord/10' : 'border-slate-700 hover:border-slate-600'}`}>
                    <p className={`font-medium text-sm ${form.lease_type === opt.value ? 'text-landlord' : 'text-slate-200'}`}>{opt.label}</p>
                    <p className="text-xs text-slate-500">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Start Date *</label>
                <input required type="date" value={form.start_date} onChange={e => set('start_date', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">End Date {form.lease_type === 'fixed' ? '*' : '(optional)'}</label>
                <input type="date" value={form.end_date} onChange={e => set('end_date', e.target.value)} className="input" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 - Rent & Fees */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Rent and fee details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Monthly Rent *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input required type="number" min="0.01" step="0.01" value={form.monthly_rent} onChange={e => set('monthly_rent', e.target.value)} placeholder="1500" className="input pl-8" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Security Deposit *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input required type="number" min="0" step="0.01" value={form.security_deposit} onChange={e => set('security_deposit', e.target.value)} placeholder="1500" className="input pl-8" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Late Fee</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input type="number" min="0" step="0.01" value={form.late_fee} onChange={e => set('late_fee', e.target.value)} className="input pl-8" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Grace Period (days)</label>
                <input type="number" value={form.late_fee_days} onChange={e => set('late_fee_days', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Rent Due Day of Month</label>
                <input type="number" min="1" max="28" value={form.rent_due_day} onChange={e => set('rent_due_day', e.target.value)} className="input" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 - Notes */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Additional terms or notes</h2>
            <div className="form-group">
              <label className="label">Special Terms or Notes</label>
              <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={5}
                placeholder="e.g. No pets allowed. Tenant is responsible for lawn care. Parking spot #12 included."
                className="textarea" />
            </div>
            <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard legally-required clauses for <strong className="text-slate-300">{US_STATES.find(s => s.code === form.state)?.name}</strong> will be automatically included. This includes security deposit terms, entry notice requirements, and habitability standards.
              </p>
            </div>
          </div>
        )}

        {/* STEP 4 - Review */}
        {step === 4 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Review and generate</h2>
            <div className="space-y-3">
              {[
                { label:'Property', value: selectedProperty?.name || '—' },
                { label:'Tenant', value: selectedTenant ? `${selectedTenant.first_name} ${selectedTenant.last_name}` : '—' },
                { label:'State', value: US_STATES.find(s => s.code === form.state)?.name || form.state },
                { label:'Lease Type', value: form.lease_type === 'fixed' ? 'Fixed Term' : 'Month-to-Month' },
                { label:'Start Date', value: form.start_date || '—' },
                { label:'End Date', value: form.end_date || 'Month-to-month' },
                { label:'Monthly Rent', value: form.monthly_rent ? `$${Number(form.monthly_rent).toLocaleString()}` : '—' },
                { label:'Security Deposit', value: form.security_deposit ? `$${Number(form.security_deposit).toLocaleString()}` : '—' },
                { label:'Late Fee', value: `$${form.late_fee} after ${form.late_fee_days} days` },
                { label:'Rent Due', value: `${form.rent_due_day}${form.rent_due_day === '1' ? 'st' : form.rent_due_day === '2' ? 'nd' : 'th'} of each month` },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-800">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-200">{item.value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-landlord/5 border border-landlord/20 rounded-xl">
              <p className="text-sm text-slate-300">
                Clicking "Generate Lease" will create a draft lease. You can review it, send it to the tenant for e-signature, and activate it once signed.
              </p>
            </div>
          </div>
        )}

        {/* NAV BUTTONS */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} className="btn-landlord flex-1 justify-center"
              disabled={
                (step === 0 && (!form.property_id || !form.tenant_id)) ||
                (step === 1 && (!form.start_date || (form.lease_type === 'fixed' && !form.end_date))) ||
                (step === 2 && (Number(form.monthly_rent) <= 0 || Number(form.security_deposit) < 0 || Number(form.late_fee) < 0))
              }>
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-landlord flex-1 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><FileText className="w-4 h-4" /> Generate Lease</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function NewLeasePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto" />}>
      <NewLeaseContent />
    </Suspense>
  )
}
