import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { LeaseActions } from './LeaseActions'

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: lease }, { data: profile }, { data: leaseEvents }, { data: tenantEvents }] = await Promise.all([
    supabase
      .from('leases')
      .select('*, properties(name, address), tenants(id, first_name, last_name, email, stripe_customer_id)')
      .eq('id', id)
      .eq('owner_id', user!.id)
      .single(),
    supabase.from('profiles').select('stripe_account_status').eq('id', user!.id).single(),
    supabase.from('automation_events').select('*').eq('owner_id', user!.id).contains('metadata', { lease_id: id }).order('created_at', { ascending: false }).limit(6),
    supabase.from('automation_events').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!lease) notFound()

  const bankSetupReady = (tenantEvents ?? []).some((event: any) => {
    if (event.kind !== 'tenant_bank_setup_completed') return false
    return event.metadata?.tenant_id === lease.tenant_id
  })

  return (
    <div>
      <Link href="/landlord/leases" className="text-sm text-slate-500 hover:text-white flex items-center gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to leases
      </Link>
      <div className="page-header">
        <h1 className="page-title">Lease</h1>
        <p className="page-subtitle">
          {lease.tenants?.first_name} {lease.tenants?.last_name} · {lease.properties?.name}
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6 space-y-3">
          <h2 className="section-title flex items-center gap-2"><FileText className="w-4 h-4" /> Terms</h2>
          <p className="text-slate-300">Rent {formatCurrency(lease.monthly_rent)}/mo · Deposit {formatCurrency(lease.security_deposit)}</p>
          <p className="text-slate-400 text-sm">{formatDate(lease.start_date)} → {formatDate(lease.end_date)}</p>
          <p className="text-slate-400 text-sm capitalize">Status: {lease.status} · {lease.state}</p>
        </div>
        <div className="card p-6 space-y-4">
          <h2 className="section-title">Recurring billing</h2>
          <p className="text-slate-400 text-sm">
            Creates a monthly Stripe subscription with ACH. Tenant must have a saved bank account. You must have Stripe Connect active.
          </p>
          <div className="space-y-2">
            {[
              { label: 'Landlord banking', done: profile?.stripe_account_status === 'active' },
              { label: 'Tenant Stripe customer', done: Boolean(lease.tenants?.stripe_customer_id) },
              { label: 'Tenant bank setup', done: bankSetupReady },
              { label: 'Recurring subscription', done: Boolean(lease.stripe_subscription_id) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-800/40 px-3 py-2">
                <p className="text-sm text-slate-300">{item.label}</p>
                <span className={`badge ${item.done ? 'bg-green-400/10 text-green-400' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                  {item.done ? 'ready' : 'pending'}
                </span>
              </div>
            ))}
          </div>
          <LeaseActions leaseId={lease.id} hasSubscription={Boolean(lease.stripe_subscription_id)} />
          {!!leaseEvents?.length && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500 mb-3">Recent billing events</p>
              <div className="space-y-2">
                {leaseEvents.map((event: any) => (
                  <div key={event.id} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <p className="text-sm text-slate-300">{event.summary}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{formatDate(event.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
