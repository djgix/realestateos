'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { US_STATES } from '@/lib/utils'

const PROPERTY_TYPES = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'multi_unit', label: 'Multi-Unit' },
  { value: 'condo', label: 'Condo' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'commercial', label: 'Commercial' },
]

export default function EditPropertyPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', city: '', state: '', zip: '',
    type: 'single_family', units: '1', bedrooms: '', bathrooms: '',
    square_feet: '', year_built: '', purchase_price: '', current_value: '',
    mortgage_balance: '', monthly_mortgage: '', notes: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('properties').select('*').eq('id', id).single()
      if (data) {
        setForm({
          name: data.name || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zip: data.zip || '',
          type: data.type || 'single_family',
          units: data.units?.toString() || '1',
          bedrooms: data.bedrooms?.toString() || '',
          bathrooms: data.bathrooms?.toString() || '',
          square_feet: data.square_feet?.toString() || '',
          year_built: data.year_built?.toString() || '',
          purchase_price: data.purchase_price?.toString() || '',
          current_value: data.current_value?.toString() || '',
          mortgage_balance: data.mortgage_balance?.toString() || '',
          monthly_mortgage: data.monthly_mortgage?.toString() || '',
          notes: data.notes || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  function numOrNull(v: string) { return v ? parseFloat(v) : null }
  function intOrNull(v: string) { return v ? parseInt(v) : null }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/landlord/properties/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, address: form.address, city: form.city, state: form.state, zip: form.zip,
        type: form.type, units: intOrNull(form.units) || 1,
        bedrooms: intOrNull(form.bedrooms), bathrooms: numOrNull(form.bathrooms),
        square_feet: intOrNull(form.square_feet), year_built: intOrNull(form.year_built),
        purchase_price: numOrNull(form.purchase_price), current_value: numOrNull(form.current_value),
        mortgage_balance: numOrNull(form.mortgage_balance), monthly_mortgage: numOrNull(form.monthly_mortgage),
        notes: form.notes || null,
      }),
    })
    if (res.ok) {
      toast.success('Property updated')
      router.push(`/landlord/properties/${id}`)
    } else {
      toast.error('Failed to save changes')
    }
    setSaving(false)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div>
      <div className="page-header flex items-center gap-4">
        <Link href={`/landlord/properties/${id}`} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Edit Property</h1>
          <p className="page-subtitle">{form.name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Property Details</h2>
          <div className="form-group">
            <label className="label">Property Name / Nickname</label>
            <input value={form.name} onChange={set('name')} className="input" required placeholder="e.g. Oak Street House" />
          </div>
          <div className="form-group">
            <label className="label">Type</label>
            <select value={form.type} onChange={set('type')} className="select">
              {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label className="label">Units</label>
              <input type="number" min="1" value={form.units} onChange={set('units')} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Bedrooms</label>
              <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} className="input" placeholder="—" />
            </div>
            <div className="form-group">
              <label className="label">Bathrooms</label>
              <input type="number" min="0" step="0.5" value={form.bathrooms} onChange={set('bathrooms')} className="input" placeholder="—" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Square Feet</label>
              <input type="number" value={form.square_feet} onChange={set('square_feet')} className="input" placeholder="—" />
            </div>
            <div className="form-group">
              <label className="label">Year Built</label>
              <input type="number" value={form.year_built} onChange={set('year_built')} className="input" placeholder="e.g. 1990" />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="section-title">Address</h2>
          <div className="form-group">
            <label className="label">Street Address</label>
            <input value={form.address} onChange={set('address')} className="input" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group col-span-1">
              <label className="label">City</label>
              <input value={form.city} onChange={set('city')} className="input" required />
            </div>
            <div className="form-group">
              <label className="label">State</label>
              <select value={form.state} onChange={set('state')} className="select" required>
                <option value="">State</option>
                {US_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">ZIP</label>
              <input value={form.zip} onChange={set('zip')} className="input" required />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="section-title">Financials</h2>
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'purchase_price', label: 'Purchase Price' },
              { key: 'current_value', label: 'Current Value' },
              { key: 'mortgage_balance', label: 'Mortgage Balance' },
              { key: 'monthly_mortgage', label: 'Monthly Mortgage' },
            ].map(f => (
              <div key={f.key} className="form-group">
                <label className="label">{f.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input type="number" value={form[f.key as keyof typeof form]} onChange={set(f.key)} className="input pl-7" placeholder="0" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={set('notes')} className="input resize-none" rows={3} placeholder="Internal notes..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-landlord">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          <Link href={`/landlord/properties/${id}`} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
