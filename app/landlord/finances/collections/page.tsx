import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { AlertTriangle, Clock, MessageCircle, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: payments } = await supabase
    .from('rent_payments')
    .select('*, tenants(first_name, last_name, phone), properties(name)')
    .eq('owner_id', user!.id)
    .order('due_date', { ascending: true })

  // Identify state for Mock Enforcement Engine
  const softEnforcement = payments?.filter(p => p.status === 'late' && getDaysUntil(p.due_date) >= -3 && getDaysUntil(p.due_date) < 0) || []
  const hardEnforcement = payments?.filter(p => p.status === 'late' && getDaysUntil(p.due_date) < -3) || []
  const upcoming = payments?.filter(p => p.status === 'pending' && getDaysUntil(p.due_date) <= 5 && getDaysUntil(p.due_date) > 0) || []

  return (
    <div className="animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
            <ShieldCheck className="w-5 h-5 text-brand-400" />
          </div>
          <h1 className="font-display text-4xl font-light text-slate-100">Collections Autopilot</h1>
        </div>
        <p className="text-slate-400 text-lg max-w-2xl mt-4">
          Acting as your digital property manager, this engine manages tenant communications prior to due dates, initiates polite soft-collections immediately when past due, and escalates to formal legal enforcement only when statutory grace periods expire.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* HARD ENFORCEMENT */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
             <AlertTriangle className="w-4 h-4 text-red-400" /> Escalated Enforcement ({hardEnforcement.length})
          </h2>
          {!hardEnforcement.length ? (
            <div className="card p-5 bg-slate-900/40 border-dashed border-slate-700 text-slate-500 text-sm">
              All accounts are within bounds. No evictions necessary.
            </div>
          ) : (
            <div className="space-y-3">
              {hardEnforcement.map((p: any) => (
                <div key={p.id} className="card p-5 border-red-500/30 bg-red-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/20 flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-slate-100 font-medium text-lg">{p.tenants?.first_name} {p.tenants?.last_name}</h3>
                      <p className="text-slate-400 text-sm">Past statutory grace period ({Math.abs(getDaysUntil(p.due_date))} days late). Soft collections failed.</p>
                      <p className="text-red-400 text-xs font-bold uppercase tracking-wider mt-2">Owes {formatCurrency(p.total_amount)}</p>
                    </div>
                  </div>
                  <Link href={`/landlord/resolutions/eviction?tenant_id=${p.tenant_id}`} className="btn bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 flex-shrink-0">
                    Generate Legal Notice <Zap className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SOFT ENFORCEMENT */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
             <MessageCircle className="w-4 h-4 text-orange-400" /> Soft Collections: Check-ins ({softEnforcement.length})
          </h2>
          {!softEnforcement.length ? (
            <div className="card p-5 bg-slate-900/40 border-dashed border-slate-700 text-slate-500 text-sm">
              No tenants in the soft-collections grace period.
            </div>
          ) : (
            <div className="space-y-3">
              {softEnforcement.map((p: any) => (
                <div key={p.id} className="card p-5 border-orange-500/20 bg-orange-500/5 relative overflow-hidden group">
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div>
                      <h3 className="text-slate-100 font-medium">{p.tenants?.first_name} {p.tenants?.last_name}</h3>
                      <p className="text-slate-400 text-xs">{p.properties?.name} · {Math.abs(getDaysUntil(p.due_date))} day(s) late</p>
                    </div>
                    <span className="badge bg-orange-500/20 text-orange-400 border border-orange-500/20">Grace Period</span>
                  </div>
                  
                  {/* Simulated Terminal Log */}
                  <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-400 relative z-10 border border-slate-800">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-800">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-slate-300">Autopilot executing soft-check...</span>
                    </div>
                    <p className="text-blue-400 mb-1">&gt; SENDING SMS TO: {p.tenants?.phone || '(555) 000-0000'}</p>
                    <p className="text-slate-300 italic">"Hi {p.tenants?.first_name}, just checking in! Your rent for {p.properties?.name} was due yesterday. Everything okay? Let us know if you need to arrange a payment plan."</p>
                    <div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
                      <span>Status: Delivered</span>
                      <span>Next action: Escalate in {3 - Math.abs(getDaysUntil(p.due_date))} day(s)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UPCOMING REMINDERS */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
             <Clock className="w-4 h-4 text-brand-400" /> Upcoming Reminders ({upcoming.length})
          </h2>
          {!upcoming.length ? (
            <div className="card p-5 bg-slate-900/40 border-dashed border-slate-700 text-slate-500 text-sm">
              No payments due within 5 days.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((p: any) => (
                <div key={p.id} className="card p-4 border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-200 text-sm font-medium">{p.tenants?.first_name}</p>
                    <span className="text-xs text-slate-500">In {getDaysUntil(p.due_date)} day(s)</span>
                  </div>
                  <div className="bg-slate-950 rounded p-2 text-[10px] font-mono text-slate-400 border border-slate-800/50">
                    <span className="text-brand-400">&gt; Scheduled SMS Reminder:</span>
                    <br/>
                    "Friendly reminder: Rent is due on {formatDate(p.due_date)}."
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
