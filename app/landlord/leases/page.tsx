import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { FileText, Plus, AlertTriangle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Leases | REALESTATEos' }

export default async function LeasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: leases } = await supabase
    .from('leases')
    .select('*, properties(name), tenants(first_name, last_name)')
    .eq('owner_id', user!.id)
    .order('end_date', { ascending: true })

  const active = leases?.filter(l => l.status === 'active') || []
  const expiringSoon = active.filter(l => getDaysUntil(l.end_date) <= 60 && getDaysUntil(l.end_date) > 0)

  const statusConfig: Record<string, string> = {
    active: 'bg-green-400/10 text-green-400',
    draft: 'bg-slate-700 text-slate-400',
    sent: 'bg-yellow-400/10 text-yellow-400',
    expired: 'bg-red-400/10 text-red-400',
    terminated: 'bg-red-400/10 text-red-400',
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Leases</h1>
          <p className="page-subtitle">{active.length} active · {expiringSoon.length} expiring soon</p>
        </div>
        <Link href="/landlord/leases/new" className="btn-landlord">
          <Plus className="w-4 h-4" /> Generate lease
        </Link>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mb-6 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <p className="text-yellow-300 font-medium text-sm">{expiringSoon.length} lease{expiringSoon.length > 1 ? 's' : ''} expiring within 60 days</p>
          </div>
          <div className="space-y-1">
            {expiringSoon.map((l: any) => (
              <div key={l.id} className="flex items-center justify-between text-sm">
                <span className="text-yellow-200/70">{l.tenants?.first_name} {l.tenants?.last_name} · {l.properties?.name}</span>
                <span className="text-yellow-400 font-medium">{getDaysUntil(l.end_date)} days left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Active', value: active.length, color:'text-green-400' },
          { label:'Expiring Soon', value: expiringSoon.length, color:'text-yellow-400' },
          { label:'Drafts', value: leases?.filter(l => l.status === 'draft').length || 0, color:'text-slate-400' },
          { label:'Monthly Rent', value: formatCurrency(active.reduce((s, l) => s + l.monthly_rent, 0)), color:'text-landlord' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <p className={`font-display text-2xl ${s.color} mb-1`}>{s.value}</p>
            <p className="text-slate-500 text-xs">{s.label}</p>
          </div>
        ))}
      </div>

      {!leases?.length ? (
        <div className="card p-16 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-display text-2xl text-slate-300 mb-2">No leases yet</h3>
          <p className="text-slate-500 mb-6">Generate a state-specific lease in minutes.</p>
          <Link href="/landlord/leases/new" className="btn-landlord inline-flex">
            <Plus className="w-4 h-4" /> Generate first lease
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 grid grid-cols-12 gap-4 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <div className="col-span-3">Tenant</div>
            <div className="col-span-3">Property</div>
            <div className="col-span-2">Rent</div>
            <div className="col-span-2">Expires</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {leases.map((l: any) => {
              const daysLeft = getDaysUntil(l.end_date)
              return (
                <Link key={l.id} href={`/landlord/leases/${l.id}`}
                  className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors items-center">
                  <div className="col-span-3 text-sm font-medium text-slate-200">{l.tenants?.first_name} {l.tenants?.last_name}</div>
                  <div className="col-span-3 text-sm text-slate-400 truncate">{l.properties?.name}</div>
                  <div className="col-span-2 text-sm font-semibold text-slate-200">{formatCurrency(l.monthly_rent)}<span className="text-slate-500 font-normal">/mo</span></div>
                  <div className="col-span-2 text-xs text-slate-400">
                    <p>{formatDate(l.end_date)}</p>
                    {daysLeft > 0 && <p className={daysLeft <= 30 ? 'text-red-400' : daysLeft <= 60 ? 'text-yellow-400' : 'text-slate-500'}>{daysLeft}d left</p>}
                  </div>
                  <div className="col-span-1"><span className={`badge text-xs capitalize ${statusConfig[l.status] || statusConfig.draft}`}>{l.status}</span></div>
                  <div className="col-span-1 text-right"><ArrowRight className="w-4 h-4 text-slate-600 ml-auto" /></div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
