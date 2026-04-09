'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, RotateCcw, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'

export default function RenewLeasePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [lease, setLease] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    monthly_rent: '',
    security_deposit: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('leases')
        .select('*, tenants(first_name, last_name), properties(name)')
        .eq('id', id)
        .single()
      if (data) {
        setLease(data)
        // Default: start day after current end, same duration (1 year)
        const currentEnd = data.end_date ? new Date(data.end_date) : new Date()
        const newStart = new Date(currentEnd)
        newStart.setDate(newStart.getDate() + 1)
        const newEnd = new Date(newStart)
        newEnd.setFullYear(newEnd.getFullYear() + 1)
        setForm({
          start_date: newStart.toISOString().split('T')[0],
          end_date: newEnd.toISOString().split('T')[0],
          monthly_rent: data.monthly_rent?.toString() || '',
          security_deposit: data.security_deposit?.toString() || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.monthly_rent || Number(form.monthly_rent) <= 0) {
      toast.error('Monthly rent must be greater than 0')
      return
    }
    if (form.end_date && form.end_date <= form.start_date) {
      toast.error('End date must be after start date')
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/landlord/leases/${id}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_date: form.start_date,
          end_date: form.end_date,
          monthly_rent: Number(form.monthly_rent),
          security_deposit: Number(form.security_deposit),
        }),
      })
      const data = await res.json()
      if (res.ok && data.new_lease_id) {
        toast.success('Lease renewed successfully!')
        router.push(`/landlord/leases/${data.new_lease_id}`)
      } else {
        toast.error(data.error || 'Failed to renew lease')
        setSaving(false)
      }
    } catch {
      toast.error('Failed to renew lease')
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
  }

  if (!lease) return null

  return (
    <div className="max-w-lg">
      <div className="page-header flex items-center gap-4">
        <Link href={`/landlord/leases/${id}`} className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Renew Lease</h1>
          <p className="page-subtitle">
            {lease.tenants?.first_name} {lease.tenants?.last_name} · {lease.properties?.name}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-6 space-y-4">
          <h2 className="section-title">New Lease Terms</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">New Start Date *</label>
              <input type="date" required value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="input" />
            </div>
            <div className="form-group">
              <label className="label">New End Date</label>
              <input type="date" value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Monthly Rent *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input type="number" required min="1" value={form.monthly_rent}
                  onChange={e => setForm(f => ({ ...f, monthly_rent: e.target.value }))}
                  className="input pl-7" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Security Deposit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                <input type="number" min="0" value={form.security_deposit}
                  onChange={e => setForm(f => ({ ...f, security_deposit: e.target.value }))}
                  className="input pl-7" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4 bg-blue-400/5 border-blue-400/20">
          <p className="text-sm text-slate-400">
            This will expire the current lease and create a new active lease with the terms above.
            Rent payment records will be auto-generated for the new lease period.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn-landlord">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Renew Lease
          </button>
          <Link href={`/landlord/leases/${id}`} className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
