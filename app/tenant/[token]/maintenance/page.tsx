import { getServiceClient } from '@/lib/supabase/service'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Wrench, Plus, ArrowLeft, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function TenantMaintenancePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = getServiceClient() as any

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, first_name, portal_token')
    .eq('portal_token', token)
    .single()

  if (!tenant) notFound()

  const { data: requests } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })

  const statusColor: Record<string, string> = {
    open: 'bg-orange-400/10 text-orange-400 border border-orange-400/20',
    in_progress: 'bg-blue-400/10 text-blue-400 border border-blue-400/20',
    completed: 'bg-green-400/10 text-green-400 border border-green-400/20',
  }

  const priorityDot: Record<string, string> = {
    emergency: 'bg-red-400',
    high: 'bg-orange-400',
    normal: 'bg-blue-400',
    low: 'bg-slate-500',
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link href={`/tenant/${token}`} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to portal
          </Link>
          <Link href={`/tenant/${token}/maintenance/new`} className="btn-landlord text-sm">
            <Plus className="w-4 h-4" /> Submit request
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Maintenance Requests</h1>
            <p className="text-slate-500 text-sm">{requests?.length || 0} total request{requests?.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {!requests?.length ? (
          <div className="card p-12 text-center">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-green-400/40" />
            <p className="text-slate-300 font-medium mb-1">No maintenance requests</p>
            <p className="text-slate-500 text-sm mb-4">Submit a request if something needs attention.</p>
            <Link href={`/tenant/${token}/maintenance/new`} className="btn-landlord text-sm inline-flex">
              <Plus className="w-4 h-4" /> Submit request
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(requests as any[]).map((req) => (
              <div key={req.id} className="card p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${priorityDot[req.priority] || priorityDot.normal}`} />
                    <p className="font-medium text-slate-200 text-sm">{req.title}</p>
                  </div>
                  <span className={`badge text-xs capitalize flex-shrink-0 ${statusColor[req.status] || 'bg-slate-700 text-slate-400'}`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </div>
                {req.description && (
                  <p className="text-slate-500 text-xs ml-4 mb-2 leading-relaxed">{req.description}</p>
                )}
                <div className="flex items-center gap-3 ml-4 text-[11px] text-slate-600">
                  <span className="capitalize">{req.category}</span>
                  <span>·</span>
                  <span className="capitalize">{req.priority} priority</span>
                  <span>·</span>
                  <span>Submitted {formatDate(req.created_at)}</span>
                </div>
                {(req.landlord_approval_status === 'pending_sms') && (
                  <p className="text-xs text-amber-400 mt-2 ml-4 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Awaiting landlord approval
                  </p>
                )}
                {req.dispatched_at && (
                  <p className="text-xs text-green-400 mt-2 ml-4">
                    Contractor dispatched {formatDate(req.dispatched_at)}
                    {req.contractor_name ? ` — ${req.contractor_name}` : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
