'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

function NewMaintenanceContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [form, setForm] = useState({
    property_id: params.get('property') || '',
    tenant_id: '', title: '', description: '',
    category: 'other', priority: 'normal',
    estimated_cost: '', contractor_name: '', contractor_phone: '',
    scheduled_date: '', notes: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const [{ data: props }, { data: tens }] = await Promise.all([
        supabase.from('properties').select('id, name').eq('owner_id', user!.id),
        supabase.from('tenants').select('id, first_name, last_name').eq('owner_id', user!.id).eq('status', 'active'),
      ])
      setProperties(props || [])
      setTenants(tens || [])
    }
    load()
  }, [])

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('maintenance_requests').insert({
      owner_id: user!.id,
      property_id: form.property_id,
      tenant_id: form.tenant_id || null,
      title: form.title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      contractor_name: form.contractor_name || null,
      contractor_phone: form.contractor_phone || null,
      scheduled_date: form.scheduled_date || null,
      status: 'open',
      notes: form.notes || null,
    })

    if (error) { toast.error(error.message); setLoading(false) }
    else { toast.success('Request created!'); router.push('/landlord/maintenance') }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="page-header flex items-center gap-4">
        <Link href="/landlord/maintenance" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">New Maintenance Request</h1>
          <p className="page-subtitle">Log a maintenance issue</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <h2 className="section-title">Request Details</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Property *</label>
                <select required value={form.property_id} onChange={e => set('property_id', e.target.value)} className="select">
                  <option value="">Select...</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Reported by Tenant</label>
                <select value={form.tenant_id} onChange={e => set('tenant_id', e.target.value)} className="select">
                  <option value="">No tenant</option>
                  {tenants.map(t => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Title *</label>
              <input required value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Leaking faucet in kitchen" className="input" />
            </div>
            <div className="form-group">
              <label className="label">Description *</label>
              <textarea required value={form.description} onChange={e => set('description', e.target.value)} rows={3} placeholder="Describe the issue in detail..." className="textarea" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)} className="select">
                  {['plumbing','electrical','hvac','appliance','structural','pest','landscaping','other'].map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Priority</label>
                <select value={form.priority} onChange={e => set('priority', e.target.value)} className="select">
                  <option value="emergency">🔴 Emergency</option>
                  <option value="high">🟠 High</option>
                  <option value="normal">🔵 Normal</option>
                  <option value="low">⚪ Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title">Contractor & Scheduling</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Contractor Name</label>
                <input value={form.contractor_name} onChange={e => set('contractor_name', e.target.value)} className="input" />
              </div>
              <div className="form-group">
                <label className="label">Contractor Phone</label>
                <input type="tel" value={form.contractor_phone} onChange={e => set('contractor_phone', e.target.value)} className="input" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="form-group">
                <label className="label">Estimated Cost</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                  <input type="number" value={form.estimated_cost} onChange={e => set('estimated_cost', e.target.value)} className="input pl-8" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Scheduled Date</label>
                <input type="datetime-local" value={form.scheduled_date} onChange={e => set('scheduled_date', e.target.value)} className="input" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-landlord flex-1 justify-center py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Request'}
          </button>
          <Link href="/landlord/maintenance" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

export default function NewMaintenancePage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto" />}>
      <NewMaintenanceContent />
    </Suspense>
  )
}
