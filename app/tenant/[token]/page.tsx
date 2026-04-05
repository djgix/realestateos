import { getServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { formatCurrency, formatDate, CONTRACTOR_TYPE } from '@/lib/utils'
import { Wrench, DollarSign, Home, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function TenantPortal({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = getServiceClient() as any

  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, properties(name, address, city, state, zip), profiles!owner_id(full_name, settings)')
    .eq('portal_token', token)
    .single()

  if (!tenant) notFound()

  const profile = Array.isArray(tenant.profiles) ? tenant.profiles[0] : tenant.profiles
  const portalEnabled = profile?.settings?.portal?.enabled !== false

  if (!portalEnabled) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-display text-slate-300 mb-2">Portal Unavailable</h1>
          <p className="text-slate-500">Contact your landlord for assistance.</p>
        </div>
      </div>
    )
  }

  const [{ data: openRequests }, { data: recentPayments }, { data: activeLeases }] = await Promise.all([
    supabase.from('maintenance_requests').select('*').eq('tenant_id', tenant.id).neq('status', 'completed').order('created_at', { ascending: false }),
    supabase.from('rent_payments').select('*').eq('tenant_id', tenant.id).order('due_date', { ascending: false }).limit(3),
    supabase.from('leases').select('*').eq('tenant_id', tenant.id).eq('status', 'active').limit(1),
  ])

  const currentLease = activeLeases?.[0]
  const nextDue = recentPayments?.find((p: any) => p.status === 'pending')
  const welcomeMessage = profile?.settings?.portal?.welcome_message ||
    `Welcome to your tenant portal for ${tenant.properties?.name || 'your home'}.`

  const statusColor: Record<string, string> = {
    open: 'bg-orange-400/10 text-orange-400',
    in_progress: 'bg-blue-400/10 text-blue-400',
    completed: 'bg-green-400/10 text-green-400',
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* HEADER */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-landlord/20 flex items-center justify-center">
            <Home className="w-5 h-5 text-landlord" />
          </div>
          <div>
            <p className="font-display text-white text-lg">Tenant Portal</p>
            <p className="text-slate-500 text-sm">{tenant.properties?.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* WELCOME */}
        <div className="card p-5">
          <p className="text-slate-300 font-medium mb-1">Hi, {tenant.first_name} 👋</p>
          <p className="text-slate-500 text-sm">{welcomeMessage}</p>
          {tenant.properties && (
            <p className="text-slate-600 text-xs mt-2">
              {tenant.properties.address}, {tenant.properties.city}, {tenant.properties.state} {tenant.properties.zip}
            </p>
          )}
        </div>

        {/* RENT STATUS */}
        {currentLease && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Rent</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-display text-slate-100">{formatCurrency(currentLease.monthly_rent)}<span className="text-slate-500 text-sm font-sans">/mo</span></p>
                {nextDue && (
                  <p className={`text-sm mt-1 ${nextDue.status === 'late' ? 'text-red-400' : 'text-slate-400'}`}>
                    {nextDue.status === 'late' ? `⚠️ Overdue — due ${formatDate(nextDue.due_date)}` : `Due ${formatDate(nextDue.due_date)}`}
                  </p>
                )}
              </div>
              <Link
                href={`/tenant/${token}/pay`}
                className="bg-landlord hover:bg-landlord/90 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors"
              >
                <DollarSign className="w-4 h-4" /> Pay Rent
              </Link>
            </div>
            {recentPayments && recentPayments.length > 0 && (
              <div className="border-t border-slate-800 pt-4 space-y-2">
                {recentPayments.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{formatDate(p.due_date)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-300">{formatCurrency(p.total_amount)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${p.status === 'paid' ? 'bg-green-400/10 text-green-400' : p.status === 'late' ? 'bg-red-400/10 text-red-400' : 'bg-yellow-400/10 text-yellow-400'}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MAINTENANCE */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Maintenance</h2>
            <Link href={`/tenant/${token}/maintenance/new`}
              className="flex items-center gap-1.5 text-sm text-landlord hover:text-landlord/80 font-medium transition-colors">
              <Plus className="w-4 h-4" /> Submit Request
            </Link>
          </div>

          {!openRequests?.length ? (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-400/40" />
              <p className="text-slate-500 text-sm">No open maintenance requests</p>
              <Link href={`/tenant/${token}/maintenance/new`}
                className="text-landlord text-sm hover:underline mt-2 inline-block">
                Submit a new request →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {openRequests.map((req: any) => (
                <div key={req.id} className="flex items-start gap-3 p-3 bg-slate-800/40 rounded-xl">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${req.priority === 'emergency' ? 'bg-red-400' : req.priority === 'high' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{req.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{req.category} · {formatDate(req.created_at)}</p>
                    {req.landlord_approval_status === 'pending_sms' && (
                      <p className="text-xs text-yellow-400 mt-0.5">Awaiting landlord approval</p>
                    )}
                    {req.dispatched_at && (
                      <p className="text-xs text-green-400 mt-0.5">Contractor dispatched {formatDate(req.dispatched_at)}</p>
                    )}
                  </div>
                  <span className={`badge text-xs capitalize flex-shrink-0 ${statusColor[req.status] || 'bg-slate-700 text-slate-400'}`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-slate-700 text-xs pb-4">
          Powered by REALESTATEos · This link is private to you
        </p>
      </div>
    </div>
  )
}
