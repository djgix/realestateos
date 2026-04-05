import { differenceInCalendarDays, parseISO } from 'date-fns'
import { collectionEscalationThresholds, formatCollectionThresholds } from '@/lib/collections'
import { createClient } from '@/lib/supabase/server'
import { parseLandlordPreferences } from '@/lib/landlord-preferences'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { AlertTriangle, Clock, MessageCircle, ShieldCheck, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: payments }, { data: autoEvents }, { data: profile }] = await Promise.all([
    supabase
      .from('rent_payments')
      .select('*, tenants(first_name, last_name, phone), properties(name, state)')
      .eq('owner_id', user!.id)
      .order('due_date', { ascending: true }),
    supabase
      .from('automation_events')
      .select('*')
      .eq('owner_id', user!.id)
      .in('kind', ['rent_reminder', 'collections_escalation', 'landlord_late_rent', 'rent_reminder_sms'])
      .order('created_at', { ascending: false })
      .limit(80),
    supabase.from('profiles').select('landlord_preferences').eq('id', user!.id).single(),
  ])

  const prefs = parseLandlordPreferences(profile?.landlord_preferences)
  const softDays = prefs.collections.soft_days_late
  const hardDays = prefs.collections.hard_days_late
  const reminderLead = prefs.automation.rent_reminder_days_before
  const collectionDays = collectionEscalationThresholds(softDays, hardDays)
  const todayYmd = new Date().toISOString().slice(0, 10)

  function daysLate(dueYmd: string) {
    return Math.max(
      0,
      differenceInCalendarDays(parseISO(`${todayYmd}T12:00:00`), parseISO(`${dueYmd}T12:00:00`))
    )
  }

  function lastEventForPayment(pid: string) {
    return autoEvents?.find((e: { metadata?: { payment_id?: string } }) => e.metadata?.payment_id === pid)
  }

  const softEnforcement =
    payments?.filter((p) => p.status === 'late' && daysLate(p.due_date as string) >= softDays && daysLate(p.due_date as string) < hardDays) ||
    []
  const hardEnforcement =
    payments?.filter((p) => p.status === 'late' && daysLate(p.due_date as string) >= hardDays) || []
  const upcoming =
    payments?.filter(
      (p) => p.status === 'pending' && getDaysUntil(p.due_date) <= reminderLead && getDaysUntil(p.due_date) > 0
    ) || []

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
          Daily automation sends rent reminders, late alerts, and staged tenant emails based on your notification settings. With your current Operations settings, collections emails fire on {formatCollectionThresholds(collectionDays)}. The soft bucket begins at day {softDays}; the escalated bucket begins at day {hardDays}. Upcoming reminders use {reminderLead} day(s) before due.
        </p>
      </div>

      <div className="card p-5 mb-6 border-slate-800 bg-slate-900/60">
        <p className="text-sm font-medium text-slate-200 mb-2">Current collections touchpoints</p>
        <div className="flex flex-wrap gap-2">
          {collectionDays.map((day) => (
            <span key={day} className="badge bg-orange-500/10 text-orange-300 border border-orange-500/20">
              Day {day}
            </span>
          ))}
        </div>
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
                      <p className="text-slate-400 text-sm">At or past your escalated threshold ({daysLate(p.due_date)} days late, limit {hardDays}d in Settings → Operations).</p>
                      <p className="text-red-400 text-xs font-bold uppercase tracking-wider mt-2">Owes {formatCurrency(p.total_amount)}</p>
                    </div>
                  </div>
                  <Link
                    href={`/landlord/legal?from=collections&tab=state&state=${p.properties?.state || ''}`}
                    className="btn bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 flex-shrink-0"
                  >
                    Open state law guide <Zap className="w-4 h-4 ml-1" />
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
                      <p className="text-slate-400 text-xs">{p.properties?.name} · {daysLate(p.due_date)} day(s) late</p>
                    </div>
                    <span className="badge bg-orange-500/20 text-orange-400 border border-orange-500/20">Grace Period</span>
                  </div>
                  
                  <div className="bg-slate-950 rounded-lg p-3 text-xs text-slate-400 border border-slate-800">
                    {(() => {
                      const ev = lastEventForPayment(p.id)
                      if (!ev) {
                        return <p className="text-slate-500">No automated tenant email logged yet for this payment (runs on the daily schedule).</p>
                      }
                      return (
                        <>
                          <p className="text-slate-300 font-medium capitalize mb-1">{String(ev.kind).replace(/_/g, ' ')}</p>
                          <p>{ev.summary}</p>
                          <p className="text-[10px] text-slate-600 mt-2">{formatDate(ev.created_at)} · {ev.channel}</p>
                        </>
                      )
                    })()}
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
              No payments due within {reminderLead} days.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((p: any) => (
                <div key={p.id} className="card p-4 border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-slate-200 text-sm font-medium">{p.tenants?.first_name}</p>
                    <span className="text-xs text-slate-500">In {getDaysUntil(p.due_date)} day(s)</span>
                  </div>
                  <div className="bg-slate-950 rounded p-2 text-[10px] text-slate-400 border border-slate-800/50">
                    {lastEventForPayment(p.id) ? (
                      <span className="text-slate-300">Last: {lastEventForPayment(p.id)?.summary}</span>
                    ) : (
                      <span className="text-slate-500">Reminder emails fire within your configured days-before-due window (daily cron).</span>
                    )}
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
