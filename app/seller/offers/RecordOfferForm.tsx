'use client'

import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export function RecordOfferForm({ listings }: { listings: { id: string; address: string }[] }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    listing_id: listings[0]?.id || '',
    buyer_name: '',
    buyer_email: '',
    offer_amount: '',
    earnest_money: '',
    financing_type: 'conventional',
    closing_date_requested: '',
    inspection_period: '10',
    notes: '',
  })

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/seller/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        listing_id: form.listing_id,
        buyer_name: form.buyer_name,
        buyer_email: form.buyer_email || undefined,
        offer_amount: Number(form.offer_amount),
        earnest_money: form.earnest_money ? Number(form.earnest_money) : undefined,
        financing_type: form.financing_type,
        closing_date_requested: form.closing_date_requested || undefined,
        inspection_period: Number(form.inspection_period) || 10,
        notes: form.notes || undefined,
      }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) {
      toast.error(data.error || 'Failed')
      return
    }
    toast.success('Offer recorded — check your email')
    window.location.reload()
  }

  if (!listings.length) return null

  return (
    <div className="mb-8">
      <button type="button" onClick={() => setOpen(!open)} className="btn-seller">
        <Plus className="w-4 h-4" /> Record incoming offer
      </button>
      {open && (
        <form onSubmit={submit} className="card p-6 mt-4 grid gap-4 md:grid-cols-2">
          <div className="form-group md:col-span-2">
            <label className="label">Listing</label>
            <select required className="select" value={form.listing_id} onChange={(e) => setForm((f) => ({ ...f, listing_id: e.target.value }))}>
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.address}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Buyer name</label>
            <input required className="input" value={form.buyer_name} onChange={(e) => setForm((f) => ({ ...f, buyer_name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Buyer email</label>
            <input type="email" className="input" value={form.buyer_email} onChange={(e) => setForm((f) => ({ ...f, buyer_email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Offer amount</label>
            <input required type="number" className="input" value={form.offer_amount} onChange={(e) => setForm((f) => ({ ...f, offer_amount: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Earnest money</label>
            <input type="number" className="input" value={form.earnest_money} onChange={(e) => setForm((f) => ({ ...f, earnest_money: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="label">Financing</label>
            <select className="select" value={form.financing_type} onChange={(e) => setForm((f) => ({ ...f, financing_type: e.target.value }))}>
              <option value="conventional">Conventional</option>
              <option value="fha">FHA</option>
              <option value="va">VA</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Requested closing date</label>
            <input type="date" className="input" value={form.closing_date_requested} onChange={(e) => setForm((f) => ({ ...f, closing_date_requested: e.target.value }))} />
          </div>
          <div className="form-group md:col-span-2">
            <label className="label">Notes</label>
            <textarea className="input min-h-[60px]" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <button type="submit" disabled={loading} className="btn-seller">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save offer'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
