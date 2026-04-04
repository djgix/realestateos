'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Home } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { US_STATES } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewBuyerSearchPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    address: '', city: '', state: 'CA', zip: '',
    asking_price: '', bedrooms: '', bathrooms: '',
    square_feet: '', year_built: '', notes: '',
  })

  function update(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.address) { toast.error('Address is required'); return }
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('buyer_searches').insert({
      owner_id: user!.id,
      address: form.address,
      city: form.city,
      state: form.state,
      zip: form.zip,
      asking_price: form.asking_price ? parseFloat(form.asking_price) : null,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseFloat(form.bathrooms) : null,
      square_feet: form.square_feet ? parseInt(form.square_feet) : null,
      year_built: form.year_built ? parseInt(form.year_built) : null,
      notes: form.notes,
      status: 'researching',
    }).select().single()

    if (error) { toast.error(error.message); setLoading(false); return }

    // Create default checklist items
    const checklistItems = [
      { phase: 'pre_offer', task: 'Get pre-approved for a mortgage', description: 'Pre-approval strengthens your offer.' },
      { phase: 'pre_offer', task: 'Research comparable sales', description: 'Know what similar homes sold for.' },
      { phase: 'pre_offer', task: 'Schedule a showing', description: 'Visit the property in person.' },
      { phase: 'pre_offer', task: 'Review seller disclosures', description: 'Read all disclosed defects carefully.' },
      { phase: 'under_contract', task: 'Pay earnest money deposit', description: 'Usually due within 3 days of acceptance.' },
      { phase: 'under_contract', task: 'Schedule home inspection', description: 'Hire a licensed inspector within contingency period.' },
      { phase: 'under_contract', task: 'Apply for mortgage formally', description: 'Submit full application immediately.' },
      { phase: 'closing', task: 'Review Closing Disclosure', description: 'Compare to your Loan Estimate carefully.' },
      { phase: 'closing', task: 'Do final walkthrough', description: 'Confirm repairs are done and home is in agreed condition.' },
      { phase: 'closing', task: 'Wire closing funds', description: 'Call title company directly to verify wire instructions.' },
      { phase: 'post_closing', task: 'Change all locks', description: 'You don\'t know who has copies of the old keys.' },
      { phase: 'post_closing', task: 'File for homestead exemption', description: 'Reduces property taxes — apply right away.' },
    ].map(item => ({ ...item, owner_id: user!.id, search_id: data.id, completed: false }))

    await supabase.from('buyer_checklist_items').insert(checklistItems)

    toast.success('Property added!')
    router.push(`/buyer/search/${data.id}`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header flex items-center gap-4">
        <Link href="/buyer/search" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title mb-0">Add a Property</h1>
          <p className="page-subtitle">Track a home you're interested in</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-8 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-buyer/10 rounded-xl flex items-center justify-center">
            <Home className="w-5 h-5 text-buyer" />
          </div>
          <h2 className="font-display text-xl text-white">Property Details</h2>
        </div>

        <div className="form-group">
          <label className="label">Street Address *</label>
          <input className="input" placeholder="123 Main Street" value={form.address} onChange={e => update('address', e.target.value)} required />
        </div>

        <div className="grid grid-cols-6 gap-3">
          <div className="form-group col-span-3">
            <label className="label">City</label>
            <input className="input" value={form.city} onChange={e => update('city', e.target.value)} />
          </div>
          <div className="form-group col-span-2">
            <label className="label">State</label>
            <select className="select" value={form.state} onChange={e => update('state', e.target.value)}>
              {US_STATES.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
            </select>
          </div>
          <div className="form-group col-span-1">
            <label className="label">ZIP</label>
            <input className="input" maxLength={5} value={form.zip} onChange={e => update('zip', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Asking Price</label>
          <input type="number" className="input" placeholder="450000" value={form.asking_price} onChange={e => update('asking_price', e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label">Bedrooms</label>
            <input type="number" className="input" placeholder="3" value={form.bedrooms} onChange={e => update('bedrooms', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Bathrooms</label>
            <input type="number" step="0.5" className="input" placeholder="2" value={form.bathrooms} onChange={e => update('bathrooms', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label">Square Feet</label>
            <input type="number" className="input" placeholder="1800" value={form.square_feet} onChange={e => update('square_feet', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Year Built</label>
            <input type="number" className="input" placeholder="1995" value={form.year_built} onChange={e => update('year_built', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="label">Notes</label>
          <textarea rows={3} className="textarea" placeholder="Why you like this property, concerns, things to research..." value={form.notes} onChange={e => update('notes', e.target.value)} />
        </div>

        <button type="submit" disabled={loading} className="btn-buyer w-full justify-center py-3">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Property & Start Checklist'}
        </button>
      </form>
    </div>
  )
}
