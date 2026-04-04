'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { US_STATES } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function NewTenantPage() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    monthly_income: '', move_in_date: '', notes: '',
    property_id: params.get('property') || '',
  })

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('tenants').insert({
      owner_id: user!.id,
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: form.phone || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      monthly_income: form.monthly_income ? Number(form.monthly_income) : null,
      move_in_date: form.move_in_date || null,
      property_id: form.property_id || null,
      status: 'applicant',
      notes: form.notes || null,
    })

    if (error) { toast.error(error.message); setLoading(false) }
    else { toast.success('Tenant added!'); router.push('/landlord/tenants') }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header flex items-center gap-4">
        <Link href="/landlord/tenants" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Add Tenant</h1>
          <p className="page-subtitle">Add a new tenant or applicant</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="section-title">Personal Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">First Name *</label>
                <input required value={form.first_name} onChange={e => set('first_name', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Last Name *</label>
                <input required value={form.last_name} onChange={e => set('last_name', e.target.value)} className="input" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Phone</label>
              <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(555) 555-5555" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input type="number" value={form.monthly_income} onChange={e => set('monthly_income', e.target.value)} placeholder="5000" className="input pl-8" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Move-in Date</label>
                <input type="date" value={form.move_in_date} onChange={e => set('move_in_date', e.target.value)} className="input" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title">Emergency Contact</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group">
              <label className="label">Contact Name</label>
              <input value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Contact Phone</label>
              <input type="tel" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} className="input" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="form-group">
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} className="textarea" placeholder="Any additional notes..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-landlord flex-1 justify-center py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Tenant'}
          </button>
          <Link href="/landlord/tenants" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
