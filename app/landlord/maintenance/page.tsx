import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { Wrench, Plus, AlertTriangle, CheckCircle2, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function MaintenancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: requests } = await supabase
    .from('maintenance_requests')
    .select('*, properties(name), tenants(first_name, last_name)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  const open = requests?.filter(r => r.status === 'open') || []
  const inProgress = requests?.filter(r => r.status === 'in_progress') || []
  const completed = requests?.filter(r => r.status === 'completed') || []
  const emergency = open.filter(r => r.priority === 'emergency')

  const priorityColor: Record<string, string> = {
    emergency: 'bg-red-400/10 text-red-400 border-red-400/20',
    high: 'bg-orange-400/10 text-orange-400 border-orange-400/20',
    normal: 'bg-blue-400/10 text-blue-400 border-blue-400/20',
    low: 'bg-slate-700 text-slate-400',
  }

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Maintenance</h1>
          <p className="page-subtitle">{open.length} open · {inProgress.length} in progress</p>
        </div>
        <Link href="/landlord/maintenance/new" className="btn-landlord">
          <Plus className="w-4 h-4" /> New request
        </Link>
      </div>

      {emergency.length > 0 && (
        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 font-medium text-sm">{emergency.length} emergency request{emergency.length > 1 ? 's' : ''} need immediate attention</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label:'Open', value: open.length, icon:Clock, color:'text-orange-400' },
          { label:'In Progress', value: inProgress.length, icon:Wrench, color:'text-blue-400' },
          { label:'Completed', value: completed.length, icon:CheckCircle2, color:'text-green-400' },
        ].map(s => (
          <div key={s.label} className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className={`font-display text-2xl ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-sm">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {!requests?.length ? (
        <div className="card p-16 text-center">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-display text-2xl text-slate-300 mb-2">No maintenance requests</h3>
          <p className="text-slate-500 mb-6">Log a request when something needs attention.</p>
          <Link href="/landlord/maintenance/new" className="btn-landlord inline-flex">
            <Plus className="w-4 h-4" /> Create request
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { title:'Open', items:open },
            { title:'In Progress', items:inProgress },
            { title:'Completed', items:completed.slice(0, 10) },
          ].filter(g => g.items.length > 0).map(group => (
            <div key={group.title}>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1">
                {group.title} ({group.items.length})
              </h2>
              <div className="card divide-y divide-slate-800/50 overflow-hidden">
                {group.items.map((req: any) => (
                  <Link key={req.id} href={`/landlord/maintenance/${req.id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/40 transition-colors">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${req.priority === 'emergency' ? 'bg-red-400' : req.priority === 'high' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-200 text-sm">{req.title}</p>
                      <p className="text-xs text-slate-500">
                        {req.properties?.name}
                        {req.tenants ? ` · ${req.tenants.first_name} ${req.tenants.last_name}` : ''}
                        {' · '}{formatDate(req.created_at)}
                      </p>
                    </div>
                    <span className={`badge text-xs capitalize border ${priorityColor[req.priority]}`}>{req.priority}</span>
                    <span className="badge text-xs bg-slate-800 text-slate-400 capitalize">{req.category}</span>
                    {req.actual_cost && <span className="text-sm text-slate-400">${req.actual_cost}</span>}
                    <ArrowRight className="w-4 h-4 text-slate-600" />
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
