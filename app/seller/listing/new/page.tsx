'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { US_STATES } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

const STEPS = ['Property Details', 'Pricing', 'Review']

export default function NewListingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    address: '', city: '', state: 'CA', zip: '',
    asking_price: '', bedrooms: '', bathrooms: '', square_feet: '', year_built: '',
    property_type: 'single_family', description: '',
  })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit() {
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const commissionSaved = Number(form.asking_price) * 0.06

    const { data, error } = await supabase.from('seller_listings').insert({
      owner_id: user!.id,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      asking_price: Number(form.asking_price),
      bedrooms: Number(form.bedrooms) || null,
      bathrooms: Number(form.bathrooms) || null,
      square_feet: Number(form.square_feet) || null,
      year_built: Number(form.year_built) || null,
      property_type: form.property_type,
      description: form.description || null,
      agent_commission_saved: commissionSaved,
      status: 'prep',
      current_step: 'prep',
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false) }
    else { toast.success('Listing created!'); router.push('/seller/dashboard') }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header flex items-center gap-4">
        <Link href="/seller/dashboard" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Start Your Listing</h1>
          <p className="page-subtitle">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => <div key={i} className={`flex-1 h-1.5 rounded-full ${i <= step ? 'bg-seller' : 'bg-slate-800'}`} />)}
      </div>

      <div className="card p-8">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Tell us about your property</h2>
            <div className="form-group">
              <label className="label">Street Address *</label>
              <input required value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main Street" className="input" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="form-group col-span-2">
                <label className="label">City *</label>
                <input required value={form.city} onChange={e => set('city', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">ZIP *</label>
                <input required value={form.zip} onChange={e => set('zip', e.target.value)} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">State *</label>
                <select value={form.state} onChange={e => set('state', e.target.value)} className="select">
                  {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Property Type</label>
                <select value={form.property_type} onChange={e => set('property_type', e.target.value)} className="select">
                  <option value="single_family">Single Family</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="multi_unit">Multi-Unit</option>
                  <option value="land">Land</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="form-group">
                <label className="label">Beds</label>
                <input type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Baths</label>
                <input type="number" step="0.5" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Sq Ft</label>
                <input type="number" value={form.square_feet} onChange={e => set('square_feet', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Year Built</label>
                <input type="number" value={form.year_built} onChange={e => set('year_built', e.target.value)} className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Property Description</label>
              <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe your home's best features..." className="textarea" />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Set your asking price</h2>
            <div className="form-group">
              <label className="label">Asking Price *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">$</span>
                <input required type="number" value={form.asking_price} onChange={e => set('asking_price', e.target.value)} placeholder="400000" className="input pl-9 text-2xl font-display" />
              </div>
            </div>
            {form.asking_price && (
              <div className="p-5 bg-seller/5 border border-seller/20 rounded-2xl">
                <p className="text-slate-400 text-sm mb-2">Estimated commission you'd pay an agent:</p>
                <p className="font-display text-3xl text-red-400 line-through mb-2">
                  ${(Number(form.asking_price) * 0.06).toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm mb-2">What you pay with SellerOS:</p>
                <p className="font-display text-4xl text-seller">$299</p>
                <p className="text-green-400 font-semibold mt-2">
                  You save ${(Number(form.asking_price) * 0.06 - 299).toLocaleString()} 🎉
                </p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-2xl text-slate-100 mb-6">Review and create listing</h2>
            <div className="space-y-2">
              {[
                { label:'Address', value: `${form.address}, ${form.city}, ${form.state} ${form.zip}` },
                { label:'Type', value: form.property_type.replace('_', ' ') },
                { label:'Bedrooms', value: form.bedrooms || '—' },
                { label:'Bathrooms', value: form.bathrooms || '—' },
                { label:'Square Feet', value: form.square_feet ? `${Number(form.square_feet).toLocaleString()} sqft` : '—' },
                { label:'Asking Price', value: form.asking_price ? `$${Number(form.asking_price).toLocaleString()}` : '—' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-slate-800">
                  <span className="text-sm text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-200 capitalize">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-8">
          {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Back</button>}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep(s => s + 1)} className="btn-seller flex-1 justify-center"
              disabled={step === 0 && (!form.address || !form.city || !form.zip) || step === 1 && !form.asking_price}>
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={loading} className="btn-seller flex-1 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Home className="w-4 h-4" /> Create Listing</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
