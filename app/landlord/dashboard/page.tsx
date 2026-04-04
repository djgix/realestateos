import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { Plus, Building2, Users, Wrench, AlertTriangle, ArrowRight, DollarSign, Activity, MessageSquare, Clock } from 'lucide-react'
import Link from 'next/link'
import FinancialChart from '@/components/dashboard/FinancialChart'

export default async function LandlordDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  const [
    { data: profile },
    { data: properties },
    { data: tenants },
    { data: maintenance },
    { data: payments },
    { data: leases }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user!.id).single(),
    supabase.from('properties').select('*').eq('owner_id', user!.id),
    supabase.from('tenants').select('*, properties(*)').eq('owner_id', user!.id),
    supabase.from('maintenance_requests').select('*, properties(*), tenants(*)').eq('owner_id', user!.id).neq('status', 'completed').order('created_at', { ascending: false }).limit(4),
    supabase.from('rent_payments').select('*, tenants(*), properties(*)').eq('owner_id', user!.id).order('due_date', { ascending: false }),
    supabase.from('leases').select('*').eq('owner_id', user!.id).eq('status', 'active')
  ])

  const activeTenants = tenants?.filter(t => t.status === 'active').length || 0
  const latePayments = payments?.filter(p => p.status === 'late') || []
  const overduePayments = latePayments.length
  const openMaintenance = maintenance?.length || 0
  const monthlyRent = leases?.reduce((s, l) => s + l.monthly_rent, 0) || 0

  const firstName = profile?.full_name?.split(' ')[0] || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const targetTenantId = latePayments[0]?.tenant_id || ''

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
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-1 mt-8">Recent Autonomous Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 border-brand-500/30 bg-slate-900 flex items-start gap-4 hover:bg-slate-800/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/20 flex-shrink-0">
             <MessageSquare className="w-4 h-4 text-brand-400" />
          </div>
          <div>
            <h3 className="text-slate-100 font-medium text-sm mb-1">Rent Reminder SMS</h3>
            <p className="text-slate-400 text-xs mb-2">Automated friendly reminder sent to active tenants.</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">14 mins ago · The Collector</p>
          </div>
        </div>

        <div className="card p-5 border-blue-500/30 bg-slate-900 flex items-start gap-4 hover:bg-slate-800/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/20 flex-shrink-0">
             <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-slate-100 font-medium text-sm mb-1">Maintenance Triage</h3>
            <p className="text-slate-400 text-xs mb-2">Plumbing issue triaged. Ready for 1-Click Auto Dispatch.</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">2 hours ago · The Fixer</p>
          </div>
        </div>

        <div className="card p-5 border-green-500/30 bg-slate-900 flex items-start gap-4 hover:bg-slate-800/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/20 flex-shrink-0">
             <Building2 className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-slate-100 font-medium text-sm mb-1">Listing Syndicated</h3>
            <p className="text-slate-400 text-xs mb-2">Vacant property successfully posted to Zillow.</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Yesterday · ATS</p>
          </div>
        </div>

        <div className="card p-5 border-slate-700/50 bg-slate-900 flex items-start gap-4 hover:bg-slate-800/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 flex-shrink-0">
             <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-slate-100 font-medium text-sm mb-1">Schedule E Paused</h3>
            <p className="text-slate-400 text-xs mb-2">Autopilot bookkeeping paused until Q4 end.</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Pending · The Bookkeeper</p>
          </div>
        </div>
      </div>

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
           <FinancialChart />
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
