'use client'

import { useState } from 'react'
import { ArrowLeft, Wrench, AlertTriangle, Send, Loader2, CheckCircle, Phone, Mail, User } from 'lucide-react'
import Link from 'next/link'
import { formatDate, CONTRACTOR_TYPE } from '@/lib/utils'
import toast from 'react-hot-toast'

export function MaintenanceClient({
  req,
  tenant,
  property,
  preferredContractor,
}: {
  req: any
  tenant: any
  property: any
  preferredContractor?: any
}) {
  const [status, setStatus] = useState(req.status)
  const [approvalStatus, setApprovalStatus] = useState(req.landlord_approval_status)
  const [isDispatching, setIsDispatching] = useState(false)
  const [contractorName, setContractorName] = useState(req.contractor_name || preferredContractor?.name || '')
  const [contractorPhone, setContractorPhone] = useState(req.contractor_phone || preferredContractor?.phone || '')
  const [contractorEmail, setContractorEmail] = useState(req.contractor_email || preferredContractor?.email || '')
  const [dispatched, setDispatched] = useState(!!req.dispatched_at)

  const suggestedType = CONTRACTOR_TYPE[req.category] || 'Handyman'

  async function handleDispatch() {
    if (!contractorName) {
      toast.error('Enter a contractor name before dispatching')
      return
    }
    setIsDispatching(true)
    try {
      const res = await fetch(`/api/landlord/maintenance/${req.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractor_name: contractorName,
          contractor_phone: contractorPhone || null,
          contractor_email: contractorEmail || null,
        }),
      })
      if (!res.ok) throw new Error('Dispatch failed')
      setStatus('in_progress')
      setApprovalStatus('approved')
      setDispatched(true)
      toast.success('Contractor notified and tenant updated.')
    } catch {
      toast.error('Failed to dispatch. Try again.')
    } finally {
      setIsDispatching(false)
    }
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      <Link href="/landlord/maintenance" className="btn-ghost mb-6 -ml-2 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-4xl text-slate-100">{req.title}</h1>
            <span className={`badge ${status === 'open' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' : 'bg-green-500/20 text-green-400 border border-green-500/20'}`}>
              {status.replace('_', ' ').toUpperCase()}
            </span>
            {req.priority === 'emergency' && (
              <span className="badge bg-red-500/20 text-red-500 border border-red-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Emergency
              </span>
            )}
            {req.submitted_via === 'tenant' && (
              <span className="badge bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs">
                Tenant Submitted
              </span>
            )}
          </div>
          <p className="text-slate-400 flex items-center gap-2">
            Reported {formatDate(req.created_at)} · {property?.name}
            {tenant && <span>· {tenant.first_name} {tenant.last_name}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT: Ticket Details */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">
              {req.submitted_via === 'tenant' ? 'Tenant Report' : 'Issue Description'}
            </h3>
            <p className="text-slate-200 text-base leading-relaxed">{req.description}</p>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <div className="card px-4 py-3 flex-1 flex items-center gap-3">
              <Wrench className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Category</p>
                <p className="text-slate-200 font-medium capitalize">{req.category}</p>
              </div>
            </div>
            <div className="card px-4 py-3 flex-1 flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${req.priority === 'emergency' ? 'bg-red-400' : req.priority === 'high' ? 'bg-orange-400' : 'bg-blue-400'}`} />
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Priority</p>
                <p className="text-slate-200 font-medium capitalize">{req.priority}</p>
              </div>
            </div>
          </div>

          {/* Tenant Info */}
          {tenant && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tenant</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-landlord/15 rounded-xl flex items-center justify-center">
                  <span className="text-landlord text-sm font-bold">{tenant.first_name[0]}{tenant.last_name[0]}</span>
                </div>
                <div>
                  <p className="font-medium text-slate-200">{tenant.first_name} {tenant.last_name}</p>
                  <div className="flex gap-3 mt-1">
                    {tenant.phone && <a href={`tel:${tenant.phone}`} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"><Phone className="w-3 h-3" />{tenant.phone}</a>}
                    {tenant.email && <a href={`mailto:${tenant.email}`} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"><Mail className="w-3 h-3" />{tenant.email}</a>}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Dispatch Panel */}
        <div className="lg:col-span-2">
          <div className="card p-6 border-brand-500/30 bg-slate-900 shadow-[0_0_40px_rgba(79,110,247,0.08)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 blur-2xl rounded-full -mr-16 -mt-16" />

            <h3 className="flex items-center gap-2 text-brand-400 font-medium mb-1 pb-4 border-b border-slate-800 relative z-10">
              <Send className="w-4 h-4" /> Contractor Dispatch
            </h3>

            {dispatched ? (
              <div className="relative z-10 pt-4">
                <div className="flex items-center gap-2 text-green-400 mb-4">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Contractor Dispatched</span>
                </div>
                {(req.contractor_name || contractorName) && (
                  <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2 text-sm">
                    {contractorName && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <User className="w-4 h-4 text-slate-500" />
                        {contractorName}
                      </div>
                    )}
                    {contractorPhone && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-4 h-4 text-slate-500" />
                        {contractorPhone}
                      </div>
                    )}
                    {contractorEmail && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-4 h-4 text-slate-500" />
                        {contractorEmail}
                      </div>
                    )}
                  </div>
                )}
                {req.dispatched_at && (
                  <p className="text-xs text-slate-600 mt-3">Dispatched {formatDate(req.dispatched_at)}</p>
                )}
              </div>
            ) : (
              <div className="relative z-10 pt-4 space-y-4">
                {approvalStatus === 'pending_sms' && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-sm text-yellow-400">
                    Waiting for your SMS approval. Reply YES to your notification to dispatch, or approve here.
                  </div>
                )}

                <div>
                  <p className="text-xs text-slate-500 mb-2">Suggested: <strong className="text-slate-400">{suggestedType}</strong></p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Contractor Name</label>
                      <input
                        type="text"
                        value={contractorName}
                        onChange={e => setContractorName(e.target.value)}
                        placeholder={`e.g. Joe's ${suggestedType} Service`}
                        className="input text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Phone (for SMS)</label>
                      <input
                        type="tel"
                        value={contractorPhone}
                        onChange={e => setContractorPhone(e.target.value)}
                        placeholder="+1 (555) 000-0000"
                        className="input text-sm py-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Email (for job details)</label>
                      <input
                        type="email"
                        value={contractorEmail}
                        onChange={e => setContractorEmail(e.target.value)}
                        placeholder="contractor@example.com"
                        className="input text-sm py-2"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleDispatch}
                  disabled={isDispatching || !contractorName}
                  className="btn bg-brand-500 hover:bg-brand-400 text-white w-full justify-center shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  {isDispatching ? <><Loader2 className="w-4 h-4 animate-spin" /> Dispatching...</> : <><Send className="w-4 h-4" /> Approve & Dispatch</>}
                </button>

                {preferredContractor && (
                  <p className="text-xs text-slate-600 text-center">
                    Pre-filled from your <Link href="/landlord/contractors" className="text-brand-400 hover:underline">contractor directory</Link>
                  </p>
                )}
                {!preferredContractor && (
                  <p className="text-xs text-slate-600 text-center">
                    <Link href="/landlord/contractors" className="text-brand-400 hover:underline">Add preferred contractors</Link> to auto-fill this form
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
