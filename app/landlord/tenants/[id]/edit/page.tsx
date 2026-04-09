'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function EditTenantPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    monthly_income: '', move_in_date: '', notes: '', status: 'active',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase.from('tenants').select('*').eq('id', id).single()
      if (data) {
        setForm({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          monthly_income: data.monthly_income?.toString() || '',
          move_in_date: data.move_in_date || '',
          notes: data.notes || '',
          status: data.status || 'active',
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/landlord/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        monthly_income: form.monthly_income ? parseFloat(form.monthly_income) : null,
      }),
    })
    if (res.ok) {
      toast.success('Tenant updated')
      router.push(`/landlord/tenants/${id}`)
    } else {
      toast.error('Failed to save changes')
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!confirm('Delete this tenant? This cannot be undone.')) return
    setDeleting(true)
    const res = await fetch(`/api/landlord/tenants/${id}/delete`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Tenant deleted')
      router.push('/landlord/tenants')
    } else {
      const { error } = await res.json()
      toast.error(error || 'Failed to delete tenant')
      setDeleting(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>

  return (
    <div>
      <div className="page-header flex items-center gap-4">
        <Link href={`/landlord/tenants/${id}`} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Edit Tenant</h1>
          <p className="page-subtitle">{form.first_name} {form.last_name}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">First Name</label>
              <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} className="input" required />
            </div>
            <div className="form-group">
              <label className="label">Last Name</label>
              <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} className="input" required />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" required />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+1 (555) 000-0000" />
          </div>
          <div className="form-group">
            <label className="label">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="select">
              <option value="applicant">Applicant</option>
              <option value="active">Active</option>
              <option value="past">Past Tenant</option>
              <option value="evicted">Evicted</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Move-in Date</label>
              <input type="date" value={form.move_in_date} onChange={e => setForm(f => ({ ...f, move_in_date: e.target.value }))} className="input" />
            </div>
            <div className="form-group">
              <label className="label">Monthly Income</label>
              <input type="number" value={form.monthly_income} onChange={e => setForm(f => ({ ...f, monthly_income: e.target.value }))} className="input" placeholder="0" />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="section-title">Emergency Contact</h2>
          <div className="form-group">
            <label className="label">Name</label>
            <input value={form.emergency_contact_name} onChange={e => setForm(f => ({ ...f, emergency_contact_name: e.target.value }))} className="input" placeholder="Full name" />
          </div>
          <div className="form-group">
            <label className="label">Phone</label>
            <input type="tel" value={form.emergency_contact_phone} onChange={e => setForm(f => ({ ...f, emergency_contact_phone: e.target.value }))} className="input" placeholder="+1 (555) 000-0000" />
          </div>
        </div>

        <div className="card p-6">
          <div className="form-group">
            <label className="label">Internal Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input resize-none" rows={4} placeholder="Private notes (not visible to tenant)" />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-landlord">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          <Link href={`/landlord/tenants/${id}`} className="btn-secondary">Cancel</Link>
        </div>

        <div className="card p-6 border border-red-500/20">
          <h2 className="section-title text-red-400 mb-2">Danger Zone</h2>
          <p className="text-slate-500 text-sm mb-4">Deleting a tenant is permanent. Tenants with active leases cannot be deleted.</p>
          <button type="button" onClick={handleDelete} disabled={deleting} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium">
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Delete Tenant
          </button>
        </div>
      </form>
    </div>
  )
}
