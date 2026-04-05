import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { AlertTriangle, Clock, MessageCircle, ShieldCheck, Zap, Settings2 } from 'lucide-react'
import Link from 'next/link'

export default async function CollectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: payments }, { data: profile }] = await Promise.all([
    supabase
      .from('rent_payments')
      .select('*, tenants(first_name, last_name, phone), properties(name)')
      .eq('owner_id', user!.id)
      .order('due_date', { ascending: true }),
    supabase.from('profiles').select('collections_config').eq('id', user!.id).single(),
  ])

  const config = (profile?.collections_config || {}) as Record<string, any>
  const configEnabled = config.enabled === true
  const gracePeriod: number = config.grace_period ?? 3
  const steps: any[] = config.steps || [
    { day: 1, channel: 'sms', auto_send: true, message: 'Hi {first_name}, just a friendly reminder that your rent of {amount} was due. Please pay at your earliest convenience.' },
    { day: 5, channel: 'email', auto_send: true, message: 'Dear {first_name}, your rent of {amount} at {property} is now {days_late} days overdue. Please remit payment immediately or contact us.' },
    { day: 14, channel: 'both', auto_send: false, message: 'Final notice: {first_name}, your account at {property} is {days_late} days delinquent. A formal notice will be issued if payment is not received within 3 days.' },
  ]

  const latePayments = payments?.filter(p => p.status === 'late') || []
  const upcoming = payments?.filter(p => p.status === 'pending' && getDaysUntil(p.due_date) <= 5 && getDaysUntil(p.due_date) > 0) || []

  const channelLabel: Record<string, string> = { sms: 'SMS', email: 'Email', both: 'SMS + Email' }

  return (
    <div className="animate-fade-in pb-12 max-w-5xl mx-auto">
      <div className="page-header mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
              <ShieldCheck className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <h1 className="font-display text-4xl font-light text-slate-100">Collections Autopilot</h1>
              <p className="text-slate-500 text-sm mt-1">
                {configEnabled ? (
                  <span className="text-green-400">Active — {gracePeriod}-day grace period · {steps.length} escalation step{steps.length !== 1 ? 's' : ''}</span>
                ) : (
                  <span className="text-slate-500">Autopilot disabled — <Link href="/landlord/settings?tab=collections" className="text-brand-400 hover:underline">enable in Settings</Link></span>
                )}
              </p>
            </div>
          </div>
          <Link href="/landlord/settings?tab=collections" className="btn-secondary text-xs">
            <Settings2 className="w-3.5 h-3.5" /> Configure Rules
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LATE PAYMENTS */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Late Payments ({latePayments.length})
          </h2>
          {!latePayments.length ? (
            <div className="card p-5 bg-slate-900/40 border-dashed border-slate-700 text-slate-500 text-sm">
              All accounts are current. No late payments.
            </div>
          ) : (
            <div className="space-y-3">
              {latePayments.map((p: any) => {
                const daysLate = Math.abs(getDaysUntil(p.due_date))
                const firedSteps = (p.collections_actions_sent as string[] | null) || []
                const nextStep = steps.find(s => s.day <= daysLate && !firedSteps.includes(`day_${s.day}`))
                return (
                  <div key={p.id} className="card p-5 border-red-500/20 bg-red-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/20 flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-slate-100 font-medium">{p.tenants?.first_name} {p.tenants?.last_name}</h3>
                        <p className="text-slate-400 text-xs">{p.properties?.name} · {daysLate} day{daysLate !== 1 ? 's' : ''} late</p>
                        <p className="text-red-400 text-xs font-semibold mt-1">{formatCurrency(p.total_amount)} overdue</p>
                        {firedSteps.length > 0 && (
                          <p className="text-slate-500 text-[10px] mt-1">Sent: {firedSteps.join(', ')}</p>
                        )}
                        {nextStep && (
                          <p className="text-orange-400 text-[10px] mt-1">
                            Next: {channelLabel[nextStep.channel]} at day {nextStep.day} · {nextStep.auto_send ? 'auto-send' : 'manual approval needed'}
                          </p>
                        )}
                      </div>
                    </div>
                    {daysLate > 14 && (
                      <Link href={`/landlord/legal`} className="btn bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 flex-shrink-0 text-sm">
                        Legal Center <Zap className="w-4 h-4 ml-1" />
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ESCALATION RULESET */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-brand-400" /> Your Escalation Rules
          </h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="card p-4 border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">Day {step.day}</span>
                    <span className="text-xs text-slate-400">{channelLabel[step.channel] || step.channel}</span>
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest font-semibold ${step.auto_send ? 'text-green-400' : 'text-yellow-400'}`}>
                    {step.auto_send ? 'Auto-send' : 'Manual approval'}
                  </span>
                </div>
                <p className="text-slate-500 text-xs leading-relaxed italic">"{step.message}"</p>
              </div>
            ))}
            {!steps.length && (
              <div className="card p-5 border-dashed border-slate-700 text-slate-500 text-sm text-center">
                No escalation rules configured. <Link href="/landlord/settings?tab=collections" className="text-brand-400 hover:underline">Add rules in Settings.</Link>
              </div>
            )}
          </div>
        </div>

        {/* UPCOMING REMINDERS */}
        <div className="lg:col-span-1">
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 px-1 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" /> Due Soon ({upcoming.length})
          </h2>
          {!upcoming.length ? (
            <div className="card p-5 bg-slate-900/40 border-dashed border-slate-700 text-slate-500 text-sm">
              No payments due within 5 days.
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((p: any) => (
                <div key={p.id} className="card p-4 border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-slate-200 text-sm font-medium">{p.tenants?.first_name} {p.tenants?.last_name}</p>
                    <span className="text-xs text-slate-500">In {getDaysUntil(p.due_date)} day{getDaysUntil(p.due_date) !== 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-slate-500 text-xs">{p.properties?.name}</p>
                  <p className="text-slate-400 text-xs mt-1 font-semibold">{formatCurrency(p.total_amount)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
