import { createClient } from '@/lib/supabase/server'
import { formatDate, getInitials } from '@/lib/utils'
import { Users, Plus, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default async function TenantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: tenants } = await supabase
    .from('tenants')
    .select('*, properties(name)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const active = tenants?.filter(t => t.status === 'active') || []
  const applicants = tenants?.filter(t => t.status === 'applicant') || []

  const statusConfig: Record<string, { label: string; color: string }> = {
    active:    { label:'Active',    color:'bg-green-400/10 text-green-400' },
    applicant: { label:'Applicant', color:'bg-yellow-400/10 text-yellow-400' },
    past:      { label:'Past',      color:'bg-slate-700 text-slate-400' },
    evicted:   { label:'Evicted',   color:'bg-red-400/10 text-red-400' },
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Tenants</h1>
          <p className="page-subtitle">{active.length} active · {applicants.length} applicants</p>
        </div>
        <Link href="/landlord/tenants/new" className="btn-landlord">
          <Plus className="w-4 h-4" /> Add tenant
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label:'Active', value: active.length, color:'text-green-400' },
          { label:'Applicants', value: applicants.length, color:'text-yellow-400' },
          { label:'Past', value: tenants?.filter(t => t.status === 'past').length || 0, color:'text-slate-400' },
        ].map(s => (
          <div key={s.label} className="card p-5 text-center">
            <p className={`font-display text-3xl ${s.color} mb-1`}>{s.value}</p>
            <p className="text-slate-500 text-sm">{s.label}</p>
          </div>
        ))}
      </div>

      {!tenants?.length ? (
        <div className="card p-16 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-display text-2xl text-slate-300 mb-2">No tenants yet</h3>
          <p className="text-slate-500 mb-6">Add your first tenant to start managing your rentals.</p>
          <Link href="/landlord/tenants/new" className="btn-landlord inline-flex">
            <Plus className="w-4 h-4" /> Add first tenant
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 grid grid-cols-12 gap-4 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <div className="col-span-4">Tenant</div>
            <div className="col-span-3">Property</div>
            <div className="col-span-2">Move-in</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y divide-slate-800/50">
            {tenants.map((t: any) => {
              const cfg = statusConfig[t.status] || statusConfig.past
              return (
                <Link key={t.id} href={`/landlord/tenants/${t.id}`}
                  className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors items-center">
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-9 h-9 bg-landlord/15 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-landlord text-sm font-semibold">{getInitials(`${t.first_name} ${t.last_name}`)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-200 text-sm">{t.first_name} {t.last_name}</p>
                      <p className="text-xs text-slate-500 truncate">{t.email}</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-sm text-slate-400 truncate">{t.properties?.name || '—'}</div>
                  <div className="col-span-2 text-sm text-slate-400">{t.move_in_date ? formatDate(t.move_in_date) : '—'}</div>
                  <div className="col-span-2"><span className={`badge text-xs ${cfg.color}`}>{cfg.label}</span></div>
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
