'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, Link2, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export function TenantPaymentActions({
  tenantId,
  hasCustomer,
  portalUrl,
  recentEvents,
}: {
  tenantId: string
  hasCustomer: boolean
  portalUrl: string
  recentEvents: Array<{ id: string; kind: string; summary: string | null; created_at: string }>
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<'cust' | 'setup' | null>(null)
  const bankSetupComplete = recentEvents.some((event) => event.kind === 'tenant_bank_setup_completed')

  async function ensureCustomer() {
    setLoading('cust')
    try {
      const res = await fetch(`/api/tenants/${tenantId}/stripe-customer`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) toast.error(data.error || 'Failed')
      else {
        toast.success(data.existing ? 'Already set up' : 'Stripe customer created')
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  async function setupIntent() {
    setLoading('setup')
    try {
      const res = await fetch(`/api/tenants/${tenantId}/setup-intent`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed')
        return
      }
      toast.success('Setup ready — share the tenant portal link for them to enter a bank account.')
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="card p-6 space-y-4">
      <h2 className="section-title">Rent (ACH)</h2>
      <p className="text-slate-400 text-sm">
        Create a Stripe customer, then share the secure link so the tenant can add a US bank account.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className={`badge ${hasCustomer ? 'bg-green-400/10 text-green-400' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
          {hasCustomer ? 'Stripe customer ready' : 'Customer not created'}
        </span>
        <span className={`badge ${bankSetupComplete ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-300 border border-yellow-400/20'}`}>
          {bankSetupComplete ? 'Bank setup complete' : 'Awaiting bank setup'}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={ensureCustomer} disabled={loading !== null} className="btn-secondary text-sm">
          {loading === 'cust' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          {hasCustomer ? 'Refresh Stripe customer' : 'Create Stripe customer'}
        </button>
        <button type="button" onClick={setupIntent} disabled={loading !== null} className="btn-secondary text-sm">
          {loading === 'setup' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Prepare bank setup
        </button>
      </div>
      <div className="p-3 bg-slate-800/50 rounded-xl">
        <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Link2 className="w-3 h-3" /> Tenant portal</p>
        <p className="text-xs text-brand-400 break-all">{portalUrl}</p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Recent rent setup activity</p>
        {!recentEvents.length ? (
          <p className="text-sm text-slate-500">No billing automation events yet.</p>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((event) => (
              <div key={event.id} className="rounded-lg bg-slate-950 border border-slate-800 p-3">
                <p className="text-sm text-slate-300">{event.summary || event.kind}</p>
                <p className="text-[11px] text-slate-500 mt-1">{new Date(event.created_at).toLocaleString('en-US')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
