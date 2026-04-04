'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function RecordPaymentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [leases, setLeases] = useState<any[]>([])
  const [form, setForm] = useState({
    lease_id: '', amount: '', late_fee: '0',
    due_date: new Date().toISOString().split('T')[0],
    paid_date: new Date().toISOString().split('T')[0],
    status: 'paid', payment_method: 'ach', notes: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase
        .from('leases')
        .select('id, monthly_rent, tenants(first_name, last_name), properties(name)')
        .eq('owner_id', user!.id)
        .eq('status', 'active')
      setLeases(data || [])
      if (data?.length) {
        setForm(f => ({ ...f, lease_id: data[0].id, amount: String(data[0].monthly_rent) }))
      }
    }
    load()
  }, [])

  function set(k: string, v: string) { setForm(p => ({ ...p, [k]: v })) }

  function handleLeaseChange(leaseId: string) {
    const lease = leases.find(l => l.id === leaseId)
    setForm(f => ({ ...f, lease_id: leaseId, amount: String(lease?.monthly_rent || '') }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const lease = leases.find(l => l.id === form.lease_id)
    if (!lease) { toast.error('Select a lease'); setLoading(false); return }

    const { data: leaseData } = await supabase.from('leases').select('tenant_id, property_id').eq('id', form.lease_id).single()

    const total = Number(form.amount) + Number(form.late_fee)
    const { error } = await supabase.from('rent_payments').insert({
      owner_id: user!.id,
      lease_id: form.lease_id,
      tenant_id: leaseData!.tenant_id,
      property_id: leaseData!.property_id,
      amount: Number(form.amount),
      late_fee: Number(form.late_fee),
      total_amount: total,
      due_date: form.due_date,
      paid_date: form.status === 'paid' ? form.paid_date : null,
      status: form.status,
      payment_method: form.payment_method,
      notes: form.notes || null,
    })

    if (error) { toast.error(error.message); setLoading(false) }
    else { toast.success('Payment recorded!'); router.push('/landlord/finances') }
  }

  const selectedLease = leases.find(l => l.id === form.lease_id)

  return (
    <div className="max-w-lg mx-auto">
      <div className="page-header flex items-center gap-4">
        <Link href="/landlord/finances" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Record Payment</h1>
          <p className="page-subtitle">Log a rent payment</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="form-group">
          <label className="label">Lease / Tenant *</label>
          <select required value={form.lease_id} onChange={e => handleLeaseChange(e.target.value)} className="select">
            <option value="">Select lease...</option>
            {leases.map(l => (
              <option key={l.id} value={l.id}>
                {l.tenants?.first_name} {l.tenants?.last_name} — {l.properties?.name} (${l.monthly_rent}/mo)
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label">Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input required type="number" value={form.amount} onChange={e => set('amount', e.target.value)} className="input pl-8" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Late Fee</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input type="number" value={form.late_fee} onChange={e => set('late_fee', e.target.value)} className="input pl-8" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label">Due Date *</label>
            <input required type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label className="label">Paid Date</label>
            <input type="date" value={form.paid_date} onChange={e => set('paid_date', e.target.value)} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className="select">
              <option value="paid">✅ Paid</option>
              <option value="pending">⏳ Pending</option>
              <option value="late">⚠️ Late</option>
              <option value="partial">🔶 Partial</option>
              <option value="failed">❌ Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Payment Method</label>
            <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)} className="select">
              <option value="ach">ACH / Bank Transfer</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="zelle">Zelle</option>
              <option value="venmo">Venmo</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
        {(Number(form.amount) + Number(form.late_fee)) > 0 && (
          <div className="p-3 bg-green-400/5 border border-green-400/20 rounded-xl text-center">
            <p className="text-xs text-slate-500">Total</p>
            <p className="font-display text-2xl text-green-400">${(Number(form.amount) + Number(form.late_fee)).toLocaleString()}</p>
          </div>
        )}
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="textarea" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-landlord flex-1 justify-center py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Record Payment'}
          </button>
          <Link href="/landlord/finances" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
