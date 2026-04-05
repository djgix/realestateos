'use client'

import { useState, useMemo } from 'react'
import { ArrowLeft, Wrench, AlertTriangle, Activity, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { triageMaintenanceDescription } from '@/lib/ai/maintenance-triage'
import toast from 'react-hot-toast'

const STATUSES = ['open', 'in_progress', 'completed', 'cancelled'] as const

export function MaintenanceClient({
  req,
  tenant,
  property,
  events,
}: {
  req: any
  tenant: any
  property: any
  events: any[]
}) {
  const router = useRouter()
  const [status, setStatus] = useState(req.status)
  const [scheduled, setScheduled] = useState(
    req.scheduled_date ? String(req.scheduled_date).slice(0, 16) : ''
  )
  const [notes, setNotes] = useState(req.notes || '')
  const [actualCost, setActualCost] = useState(req.actual_cost != null ? String(req.actual_cost) : '')
  const [contractorName, setContractorName] = useState(req.contractor_name || '')
  const [contractorPhone, setContractorPhone] = useState(req.contractor_phone || '')
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)

  const triage = useMemo(() => triageMaintenanceDescription(req.description || ''), [req.description])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/maintenance/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          scheduled_date: scheduled ? new Date(scheduled).toISOString() : null,
          notes,
          actual_cost: actualCost ? Number(actualCost) : null,
          contractor_name: contractorName || null,
          contractor_phone: contractorPhone || null,
          notify_tenant: notify,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Save failed')
        return
      }
      const statusMessage =
        data.notification_status === 'sent'
          ? 'tenant notified'
          : data.notification_status === 'quiet_hours'
            ? 'tenant notification deferred for quiet hours'
            : data.notification_status === 'failed'
              ? 'save completed but tenant notification failed'
              : notify
                ? 'no tenant notification sent'
                : 'tenant notification skipped'
      toast.success(`Saved · ${statusMessage}`)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      <Link href="/landlord/maintenance" className="text-sm text-slate-500 hover:text-white flex items-center gap-2 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-4xl text-slate-100">{req.title}</h1>
            <span className={`badge ${status === 'open' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
              {String(status).toUpperCase().replace('_', ' ')}
            </span>
            {req.priority === 'emergency' && (
              <span className="badge bg-red-500/20 text-red-500 border border-red-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Emergency flag
              </span>
            )}
          </div>
          <p className="text-slate-400 flex items-center gap-2">
            Requested {formatDate(req.created_at)} · {property?.name} · {tenant?.first_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6 bg-slate-900 border-slate-800">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Tenant report</h3>
            <p className="text-slate-200 text-lg leading-relaxed">{req.description}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="card px-4 py-3 flex-1 flex items-center gap-3">
              <Wrench className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Category</p>
                <p className="text-slate-200 font-medium capitalize">{req.category}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 border-brand-500/30 bg-slate-900">
            <h3 className="flex items-center gap-2 text-brand-400 font-medium mb-3">
              <Activity className="w-4 h-4" /> Maintenance triage
            </h3>
            <p className="text-xs text-slate-500 uppercase mb-1">Suggested severity: {triage.severity}</p>
            <p className="text-sm text-slate-300 mb-2">{triage.summary}</p>
            <p className="text-xs text-brand-300">Trade: {triage.suggestedTrade}</p>
            <p className="text-[10px] text-slate-600 mt-3">Rule-based assist — verify before dispatching vendors.</p>
          </div>

          <div className="card p-6 border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Update & notify</h3>
            <div className="space-y-3">
              <div className="form-group">
                <label className="label">Status</label>
                <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="label">Scheduled (local)</label>
                <input type="datetime-local" className="input" value={scheduled} onChange={(e) => setScheduled(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Internal notes</label>
                <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Actual cost</label>
                <input type="number" min={0} step="0.01" className="input" value={actualCost} onChange={(e) => setActualCost(e.target.value)} placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="label">Contractor name</label>
                <input className="input" value={contractorName} onChange={(e) => setContractorName(e.target.value)} placeholder="Acme Plumbing" />
              </div>
              <div className="form-group">
                <label className="label">Contractor phone</label>
                <input className="input" value={contractorPhone} onChange={(e) => setContractorPhone(e.target.value)} placeholder="(555) 555-5555" />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-400">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                Email tenant when status or schedule changes
              </label>
              <button type="button" onClick={save} disabled={saving} className="btn bg-brand-500 hover:bg-brand-400 text-white w-full justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
              </button>
            </div>
          </div>

          <div className="card p-6 border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200 mb-4">Audit trail</h3>
            {!events.length ? (
              <p className="text-sm text-slate-500">No automation events logged for this request yet.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
                    <div className="flex items-center justify-between gap-3 mb-1">
                      <p className="text-xs uppercase tracking-wider text-slate-500">{String(event.kind).replace(/_/g, ' ')}</p>
                      <p className="text-[11px] text-slate-600">{formatDate(event.created_at)}</p>
                    </div>
                    <p className="text-sm text-slate-300">{event.summary}</p>
                    <p className="text-[11px] text-slate-500 mt-2">Channel: {event.channel}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
