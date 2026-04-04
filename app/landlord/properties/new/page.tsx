'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { US_STATES } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewPropertyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: 'CA', zip: '',
    type: 'single_family', units: 1,
    purchase_price: '', current_value: '', mortgage_balance: '', monthly_mortgage: '',
    year_built: '', square_feet: '', bedrooms: '', bathrooms: '', notes: '',
  })

  function set(key: string, value: any) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('properties').insert({
      owner_id: user!.id,
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      type: form.type,
      units: Number(form.units),
      purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
      current_value: form.current_value ? Number(form.current_value) : null,
      mortgage_balance: form.mortgage_balance ? Number(form.mortgage_balance) : null,
      monthly_mortgage: form.monthly_mortgage ? Number(form.monthly_mortgage) : null,
      year_built: form.year_built ? Number(form.year_built) : null,
      square_feet: form.square_feet ? Number(form.square_feet) : null,
      bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
      bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
      notes: form.notes || null,
    })

    if (error) { toast.error(error.message); setLoading(false) }
    else { toast.success('Property added!'); router.push('/landlord/properties') }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header flex items-center gap-4">
        <Link href="/landlord/properties" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Add Property</h1>
          <p className="page-subtitle">Add a rental property to your portfolio</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BASIC INFO */}
        <div className="card p-6">
          <h2 className="section-title">Basic Information</h2>
          <div className="space-y-4">
            <div className="form-group">
              <label className="label">Property Name *</label>
              <input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. 123 Main St Unit A" className="input" />
            </div>
            <div className="form-group">
              <label className="label">Street Address *</label>
              <input required value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 Main Street" className="input" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="form-group col-span-2">
                <label className="label">City *</label>
                <input required value={form.city} onChange={e => set('city', e.target.value)} placeholder="Los Angeles" className="input" />
              </div>
              <div className="form-group">
                <label className="label">ZIP *</label>
                <input required value={form.zip} onChange={e => set('zip', e.target.value)} placeholder="90210" className="input" />
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
                <select value={form.type} onChange={e => set('type', e.target.value)} className="select">
                  <option value="single_family">Single Family</option>
                  <option value="multi_unit">Multi-Unit</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3">
              <div className="form-group">
                <label className="label">Units</label>
                <input type="number" min="1" value={form.units} onChange={e => set('units', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Bedrooms</label>
                <input type="number" min="0" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="3" className="input" />
              </div>
              <div className="form-group">
                <label className="label">Bathrooms</label>
                <input type="number" min="0" step="0.5" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} placeholder="2" className="input" />
              </div>
              <div className="form-group">
                <label className="label">Sq Ft</label>
                <input type="number" value={form.square_feet} onChange={e => set('square_feet', e.target.value)} placeholder="1200" className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Year Built</label>
              <input type="number" value={form.year_built} onChange={e => set('year_built', e.target.value)} placeholder="1990" className="input" />
            </div>
          </div>
        </div>

        {/* FINANCIAL INFO */}
        <div className="card p-6">
          <h2 className="section-title">Financial Details</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label:'Purchase Price', key:'purchase_price', placeholder:'350000' },
              { label:'Current Market Value', key:'current_value', placeholder:'420000' },
              { label:'Mortgage Balance', key:'mortgage_balance', placeholder:'280000' },
              { label:'Monthly Mortgage Payment', key:'monthly_mortgage', placeholder:'1850' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="label">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input type="number" value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)} placeholder={f.placeholder} className="input pl-8" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NOTES */}
        <div className="card p-6">
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Any additional notes about this property..." className="textarea" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-landlord flex-1 justify-center py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Property'}
          </button>
          <Link href="/landlord/properties" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
