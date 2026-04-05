import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { Plus, Building2, Users, Wrench, AlertTriangle, ArrowRight, DollarSign, Activity, MessageSquare, Clock, CheckCircle2, Send } from 'lucide-react'
import { FinancialChart } from '@/components/dashboard/FinancialChart'
import Link from 'next/link'

export default async function LandlordDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: profile },
    { data: properties },
    { data: tenants },
    { data: maintenance },
    { data: payments },
    { data: leases },
    { data: recentDispatches },
    { data: recentPortalSubmissions },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('properties').select('*').eq('owner_id', user!.id),
    supabase.from('tenants').select('*, properties(*)').eq('owner_id', user!.id),
    supabase.from('maintenance_requests').select('*, properties(*), tenants(*)').eq('owner_id', user!.id).neq('status', 'completed').order('created_at', { ascending: false }).limit(4),
    supabase.from('rent_payments').select('*, tenants(*), properties(*)').eq('owner_id', user!.id).order('due_date', { ascending: false }),
    supabase.from('leases').select('*').eq('owner_id', user!.id).eq('status', 'active'),
    supabase.from('maintenance_requests').select('*, tenants(first_name, last_name), properties(name)').eq('owner_id', user!.id).eq('landlord_approval_status', 'approved').gte('updated_at', sevenDaysAgo).order('updated_at', { ascending: false }).limit(3),
    supabase.from('maintenance_requests').select('*, tenants(first_name, last_name), properties(name)').eq('owner_id', user!.id).eq('submitted_via', 'tenant').gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(3),
  ])

  const activeTenants = tenants?.filter(t => t.status === 'active').length || 0
  const latePayments = payments?.filter(p => p.status === 'late') || []
  const overduePayments = latePayments.length
  const openMaintenance = maintenance?.length || 0
  const monthlyRent = leases?.reduce((s, l) => s + l.monthly_rent, 0) || 0

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Build a real feed of recent automated events
  type FeedEvent = { id: string; icon: string; color: string; borderColor: string; title: string; subtitle: string; time: string; source: string }
  const feedEvents: FeedEvent[] = []

  for (const d of (recentDispatches || [])) {
    feedEvents.push({
      id: `dispatch-${d.id}`,
      icon: 'wrench',
      color: 'text-blue-400',
      borderColor: 'border-blue-500/30',
      title: `Contractor Dispatched`,
      subtitle: `${d.title} — ${(d.properties as any)?.name}`,
      time: formatDate(d.updated_at || d.created_at),
      source: 'The Fixer',
    })
  }

  for (const p of (recentPortalSubmissions || [])) {
    feedEvents.push({
      id: `portal-${p.id}`,
      icon: 'send',
      color: 'text-brand-400',
      borderColor: 'border-brand-500/30',
      title: `Tenant Portal Submission`,
      subtitle: `${(p.tenants as any)?.first_name} ${(p.tenants as any)?.last_name} — ${p.title}`,
      time: formatDate(p.created_at),
      source: 'Tenant Portal',
    })
  }

  for (const p of latePayments.slice(0, 2)) {
    feedEvents.push({
      id: `late-${(p as any).id}`,
      icon: 'alert',
      color: 'text-orange-400',
      borderColor: 'border-orange-500/30',
      title: `Late Payment Flagged`,
      subtitle: `${(p as any).tenants?.first_name} ${(p as any).tenants?.last_name} — ${formatCurrency((p as any).total_amount)} overdue`,
      time: formatDate((p as any).due_date),
      source: 'The Collector',
    })
  }

  feedEvents.sort((a, b) => b.time.localeCompare(a.time))
  const showFeed = feedEvents.length > 0

  return (
    <div className="animate-fade-in pb-12">
      <div className="page-header flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
              <Activity className="w-5 h-5 text-brand-400" />
            </div>
            <h1 className="font-display text-4xl font-light text-slate-100">{greeting}, {firstName}</h1>
          </div>
          <p className="page-subtitle mt-2">Autopilot Systems Online. Financials & Management automated.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/landlord/tenants/new" className="btn-secondary">
            <Users className="w-4 h-4" /> Add tenant
          </Link>
          <Link href="/landlord/properties/new" className="btn-landlord">
            <Plus className="w-4 h-4" /> Add property
          </Link>
        </div>
      </div>

      {/* AUTONOMOUS PM FEED */}
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-1 mt-8">Recent Automated Activity</h2>
      {!showFeed ? (
        <div className="card p-5 mb-8 flex items-center gap-4 border-dashed border-slate-700 bg-slate-900/40">
          <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-slate-400 text-sm">All systems quiet. Your autopilot is monitoring {properties?.length || 0} propert{properties?.length === 1 ? 'y' : 'ies'}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {feedEvents.slice(0, 4).map(ev => (
            <div key={ev.id} className={`card p-5 ${ev.borderColor} bg-slate-900 flex items-start gap-4 hover:bg-slate-800/50 transition-colors`}>
              <div className={`w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0`}>
                {ev.icon === 'wrench' && <Wrench className={`w-4 h-4 ${ev.color}`} />}
                {ev.icon === 'send' && <Send className={`w-4 h-4 ${ev.color}`} />}
                {ev.icon === 'alert' && <AlertTriangle className={`w-4 h-4 ${ev.color}`} />}
              </div>
              <div>
                <h3 className="text-slate-100 font-medium text-sm mb-1">{ev.title}</h3>
                <p className="text-slate-400 text-xs mb-2">{ev.subtitle}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">{ev.time} · {ev.source}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Monthly MRR', value: formatCurrency(monthlyRent), color:'text-green-400' },
          { label:'Delinquent', value: overduePayments, color:'text-red-400' },
          { label:'Properties', value: properties?.length || 0, color:'text-slate-200' },
          { label:'Active Tenants', value: activeTenants, color:'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-slate-500 text-xs">{s.label}</span>
            <p className={`font-display text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FINANCIAL CHART */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="section-title mb-0">Financial Overview</h2>
            <FinancialChart />
          </div>
        </div>

        <div className="space-y-6">
          {/* MAINTENANCE MINI */}
          <div className="card xl:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title mb-0">Open Tickets</h2>
              <Link href="/landlord/maintenance" className="text-landlord text-xs flex items-center gap-1 hover:text-brand-400 transition-colors">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {!maintenance?.length ? (
              <p className="text-slate-500 text-sm text-center py-6">No open requests.</p>
            ) : (
              <div className="space-y-3">
                {maintenance.map((m: any) => (
                  <Link key={m.id} href={`/landlord/maintenance/${m.id}`} className="block group">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-200 group-hover:text-brand-400 transition-colors">{m.title}</p>
                        <p className="text-xs text-slate-500">{m.properties?.name}</p>
                      </div>
                      <span className={`w-2 h-2 rounded-full mt-1.5 ${m.priority === 'emergency' ? 'bg-red-400' : 'bg-blue-400'}`} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
