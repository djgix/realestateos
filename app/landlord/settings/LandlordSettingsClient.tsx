'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, Bell, Shield, Building2, Check, Loader2, ExternalLink, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import type { LandlordPreferences } from '@/lib/landlord-preferences'
import type { IntegrationStatus } from '@/lib/integrations-status'
import { collectionEscalationThresholds, formatCollectionThresholds } from '@/lib/collections'

const VALID_SETTINGS_TABS = new Set([
  'profile',
  'billing',
  'banking',
  'notifications',
  'operations',
  'integrations',
  'security',
])

const COMMON_TIMEZONES = [
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Phoenix',
  'Pacific/Honolulu',
  'UTC',
]

const PLANS = [
  { id: 'starter', name: 'Starter', price: 19, features: ['2 properties', '4 units', 'Rent collection', 'Lease generation'] },
  { id: 'growth', name: 'Growth', price: 39, features: ['10 properties', 'Unlimited units', 'Legal center', 'Schedule E', 'Background checks'] },
  { id: 'pro', name: 'Pro', price: 79, features: ['Unlimited everything', 'Team access', 'Priority support', 'API access'] },
]

const NOTIFICATION_OPTIONS: Array<{
  key: keyof LandlordPreferences['notifications']
  label: string
  pending?: boolean
}> = [
  { key: 'email_late_rent', label: 'Late rent (landlord alert)' },
  { key: 'email_lease_expiry', label: 'Lease expiring' },
  { key: 'email_rent_reminder', label: 'Rent reminder (to tenant)' },
  { key: 'email_maintenance_new', label: 'New maintenance', pending: true },
  { key: 'email_payment_received', label: 'Payment received (landlord)' },
  { key: 'email_lease_signed', label: 'Lease signed', pending: true },
  { key: 'email_weekly_summary', label: 'Weekly summary (Mondays)' },
  { key: 'sms_late_rent', label: 'SMS late rent (landlord, needs Twilio)' },
  { key: 'sms_rent_reminder', label: 'SMS rent reminder (tenant)' },
  { key: 'sms_maintenance_update', label: 'SMS maintenance update (tenant)' },
]

function SettingsInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState(params.get('tab') || 'profile')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [connectLoading, setConnectLoading] = useState(false)
  const [integrationsLoading, setIntegrationsLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '' })
  const [prefs, setPrefs] = useState<LandlordPreferences | null>(null)
  const [businessAddress, setBusinessAddress] = useState('')
  const [leaseExpiryInput, setLeaseExpiryInput] = useState('60,30,14')
  const [newPassword, setNewPassword] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([])

  useEffect(() => {
    const t = params.get('tab')
    if (t && VALID_SETTINGS_TABS.has(t)) setTab(t)
  }, [params])

  useEffect(() => {
    if (tab !== 'integrations') return
    setIntegrationsLoading(true)
    fetch('/api/settings/integrations-status')
      .then((r) => r.json())
      .then((j) => setIntegrations(Array.isArray(j.integrations) ? j.integrations : []))
      .catch(() => setIntegrations([]))
      .finally(() => setIntegrationsLoading(false))
  }, [tab])

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setForm({ full_name: data?.full_name || '', email: user.email || '' })
      setPrefsLoading(true)
      const res = await fetch('/api/settings/landlord')
      if (res.ok) {
        const j = await res.json()
        setPrefs(j.landlord_preferences)
        setBusinessAddress(j.business_address || '')
        setLeaseExpiryInput((j.landlord_preferences?.automation?.lease_expiry_notice_days || [60, 30, 14]).join(','))
      }
      setPrefsLoading(false)
      if (params.get('stripe') === 'success') toast.success('Bank account connected successfully!')
      if (params.get('upgraded') === 'true') toast.success('Plan upgraded successfully!')
    }
    load()
  }, [params])

  function goToTab(id: string) {
    setTab(id)
    router.replace(`/landlord/settings?tab=${id}`, { scroll: false })
  }

  async function saveProfile() {
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', user!.id)
    toast.success('Profile updated!')
    setLoading(false)
  }

  async function savePrefs() {
    if (!prefs) return
    const days = leaseExpiryInput
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !Number.isNaN(n) && n > 0)
    const merged: Partial<LandlordPreferences> = {
      ...prefs,
      automation: { ...prefs.automation, lease_expiry_notice_days: days.length ? days : [60, 30, 14] },
    }
    setLoading(true)
    const res = await fetch('/api/settings/landlord', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ landlord_preferences: merged, business_address: businessAddress }),
    })
    setLoading(false)
    if (!res.ok) {
      toast.error('Could not save settings')
      return
    }
    const j = await res.json()
    setPrefs(j.landlord_preferences)
    toast.success('Preferences saved')
  }

  async function changePassword() {
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) toast.error(error.message)
    else {
      toast.success('Password updated')
      setNewPassword('')
    }
  }

  async function exportData() {
    window.open('/api/export/landlord', '_blank')
  }

  async function deleteAccount() {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Type DELETE to confirm')
      return
    }
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Could not delete account')
      return
    }
    toast.success('Account removed')
    router.push('/')
  }

  async function handleUpgrade(plan: string) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: 'landlord', plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  async function connectStripe() {
    setConnectLoading(true)
    const res = await fetch('/api/stripe/connect', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    else {
      toast.error('Failed to connect bank account')
      setConnectLoading(false)
    }
  }

  function toggleNotif<K extends keyof LandlordPreferences['notifications']>(key: K) {
    if (!prefs) return
    setPrefs({
      ...prefs,
      notifications: { ...prefs.notifications, [key]: !prefs.notifications[key] },
    })
  }

  const collectionDays = prefs
    ? collectionEscalationThresholds(prefs.collections.soft_days_late, prefs.collections.hard_days_late)
    : []

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'banking', label: 'Rent Banking', icon: Building2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'operations', label: 'Operations', icon: SlidersHorizontal },
    { id: 'integrations', label: 'Integrations', icon: ExternalLink },
    { id: 'security', label: 'Security', icon: Shield },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-2 h-fit">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => goToTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${tab === t.id ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Profile Information</h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-landlord/20 rounded-2xl flex items-center justify-center">
                  <span className="text-landlord text-2xl font-bold">{form.full_name?.[0]?.toUpperCase() || '?'}</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{form.full_name || 'Your Name'}</p>
                  <p className="text-slate-500 text-sm">{form.email}</p>
                  <span className={`badge text-xs mt-1 capitalize ${profile?.plan === 'pro' ? 'bg-landlord/10 text-landlord' : profile?.plan === 'growth' ? 'bg-blue-400/10 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                    {profile?.plan || 'trial'} plan
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Email</label>
                  <input value={form.email} disabled className="input opacity-50 cursor-not-allowed" />
                </div>
                <button onClick={saveProfile} disabled={loading} className="btn-landlord">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-200">Current Plan</h2>
                  <span className="badge bg-landlord/10 text-landlord capitalize">{profile?.plan || 'trial'}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {PLANS.map((plan) => (
                    <div key={plan.id} className={`p-4 rounded-xl border transition-all ${profile?.plan === plan.id ? 'border-landlord/40 bg-landlord/5' : 'border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-200">{plan.name}</h3>
                        {profile?.plan === plan.id && <Check className="w-4 h-4 text-landlord" />}
                      </div>
                      <p className="font-display text-2xl text-slate-200 mb-3">
                        ${plan.price}<span className="text-slate-500 text-sm font-sans">/mo</span>
                      </p>
                      <ul className="space-y-1 mb-4">
                        {plan.features.map((f) => (
                          <li key={f} className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-landlord" /> {f}
                          </li>
                        ))}
                      </ul>
                      {profile?.plan !== plan.id && (
                        <button onClick={() => handleUpgrade(plan.id)} className="btn-secondary w-full text-xs justify-center py-2">
                          {(plan.price > (PLANS.find((p) => p.id === profile?.plan)?.price || 0)) ? 'Upgrade' : 'Switch'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Billing powered by <strong className="text-slate-400">Polar.sh</strong> · Cancel anytime
                </p>
              </div>
            </div>
          )}

          {tab === 'banking' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">Rent Collection Banking</h2>
              <p className="text-slate-500 text-sm mb-6">
                Connect Stripe Express so tenants can pay via ACH. Daily automation sends rent reminders and late notices based on your notification settings once <code className="text-xs bg-slate-800 px-1 rounded">CRON_SECRET</code> and the daily job are configured.
              </p>
              {profile?.stripe_account_status === 'active' ? (
                <div className="p-5 bg-green-400/5 border border-green-400/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <p className="font-semibold text-green-300">Bank account connected</p>
                  </div>
                  <p className="text-slate-500 text-sm">Tenants can pay rent through the app when they complete bank setup.</p>
                </div>
              ) : (
                <button onClick={connectStripe} disabled={connectLoading} className="btn-landlord">
                  {connectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Building2 className="w-4 h-4" /> Connect Bank Account</>}
                </button>
              )}
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Notification Preferences</h2>
              {prefsLoading || !prefs ? (
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
              ) : (
                <>
                  <div className="form-group mb-6">
                    <label className="label">Business address (email footer)</label>
                    <input className="input" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} placeholder="123 Main St, City, ST 12345" />
                  </div>
                  <div className="space-y-1">
                    {NOTIFICATION_OPTIONS.map(({ key, label, pending }) => (
                      <div key={key} className="flex items-center justify-between px-4 py-4 rounded-xl hover:bg-slate-800/40 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{label}</p>
                          {pending && <p className="text-[11px] text-slate-500 mt-1">Shown for roadmap visibility. Send path not wired yet.</p>}
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={prefs.notifications[key]} disabled={pending} onChange={() => toggleNotif(key)} />
                          <div className={`w-10 h-5 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all ${pending ? 'bg-slate-800 cursor-not-allowed opacity-50' : 'bg-slate-700 peer peer-checked:after:translate-x-5 peer-checked:bg-landlord'}`} />
                        </label>
                      </div>
                    ))}
                  </div>
                  <button onClick={savePrefs} className="btn-landlord mt-6" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save notifications'}
                  </button>
                  <p className="text-xs text-slate-500 mt-6">Emails via Resend. SMS requires Twilio env vars.</p>
                </>
              )}
            </div>
          )}

          {tab === 'operations' && prefs && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Automation rules</h2>
              <div className="form-group">
                <label className="label">Days before due to email tenant reminder</label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  className="input"
                  value={prefs.automation.rent_reminder_days_before}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      automation: { ...prefs.automation, rent_reminder_days_before: Number(e.target.value) || 3 },
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label className="label">Lease expiry notice days (comma-separated)</label>
                <input className="input" value={leaseExpiryInput} onChange={(e) => setLeaseExpiryInput(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="label">Timezone (cron uses this for “today”)</label>
                <select
                  className="select"
                  value={COMMON_TIMEZONES.includes(prefs.automation.timezone) ? prefs.automation.timezone : '__custom__'}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === '__custom__') return
                    setPrefs({ ...prefs, automation: { ...prefs.automation, timezone: v } })
                  }}
                >
                  {COMMON_TIMEZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                  <option value="__custom__">Custom (type below)</option>
                </select>
                {!COMMON_TIMEZONES.includes(prefs.automation.timezone) && (
                  <input
                    className="input mt-2"
                    placeholder="IANA timezone"
                    value={prefs.automation.timezone}
                    onChange={(e) =>
                      setPrefs({ ...prefs, automation: { ...prefs.automation, timezone: e.target.value } })
                    }
                  />
                )}
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-slate-200">Quiet hours (no automated email/SMS)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={prefs.automation.quiet_hours_enabled}
                      onChange={() =>
                        setPrefs({
                          ...prefs,
                          automation: { ...prefs.automation, quiet_hours_enabled: !prefs.automation.quiet_hours_enabled },
                        })
                      }
                    />
                    <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-landlord" />
                  </label>
                </div>
                <p className="text-xs text-slate-500">Cron and maintenance tenant updates skip outbound messages during this window (your timezone above). Receipts to tenants still send from Stripe webhooks.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group mb-0">
                    <label className="label text-xs">Start (24h)</label>
                    <input
                      type="time"
                      className="input"
                      value={prefs.automation.quiet_hours_start.length === 5 ? prefs.automation.quiet_hours_start : '22:00'}
                      onChange={(e) =>
                        setPrefs({
                          ...prefs,
                          automation: { ...prefs.automation, quiet_hours_start: e.target.value || '22:00' },
                        })
                      }
                    />
                  </div>
                  <div className="form-group mb-0">
                    <label className="label text-xs">End (24h)</label>
                    <input
                      type="time"
                      className="input"
                      value={prefs.automation.quiet_hours_end.length === 5 ? prefs.automation.quiet_hours_end : '07:00'}
                      onChange={(e) =>
                        setPrefs({
                          ...prefs,
                          automation: { ...prefs.automation, quiet_hours_end: e.target.value || '07:00' },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="label">Soft collections start (days late)</label>
                  <input
                    type="number"
                    min={1}
                    max={29}
                    className="input"
                    value={prefs.collections.soft_days_late}
                    onChange={(e) =>
                      setPrefs({
                        ...prefs,
                        collections: {
                          ...prefs.collections,
                          soft_days_late: Math.min(29, Math.max(1, Number(e.target.value) || 3)),
                        },
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="label">Escalated / hard bucket (days late)</label>
                  <input
                    type="number"
                    min={2}
                    max={60}
                    className="input"
                    value={prefs.collections.hard_days_late}
                    onChange={(e) =>
                      setPrefs({
                        ...prefs,
                        collections: {
                          ...prefs.collections,
                          hard_days_late: Math.min(60, Math.max(2, Number(e.target.value) || 7)),
                        },
                      })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Collections tone (tenant emails)</label>
                <select
                  className="select"
                  value={prefs.collections.tone}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      collections: { ...prefs.collections, tone: e.target.value as LandlordPreferences['collections']['tone'] },
                    })
                  }
                >
                  <option value="friendly">Friendly</option>
                  <option value="neutral">Neutral</option>
                  <option value="firm">Firm</option>
                </select>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <p className="text-sm font-medium text-slate-200 mb-1">Current collections ladder</p>
                <p className="text-xs text-slate-500 mb-3">
                  With these settings, staged tenant collections emails fire on {formatCollectionThresholds(collectionDays)}. The hard bucket begins at day {prefs.collections.hard_days_late} late.
                </p>
                <div className="flex flex-wrap gap-2">
                  {collectionDays.map((day) => (
                    <span key={day} className="badge bg-orange-500/10 text-orange-300 border border-orange-500/20">
                      Day {day}
                    </span>
                  ))}
                </div>
              </div>
              <button onClick={savePrefs} className="btn-landlord" disabled={loading}>
                Save operations
              </button>
            </div>
          )}

          {tab === 'integrations' && (
            <div className="card p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-200">Integrations</h2>
              {integrationsLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              ) : (
                <>
                  <div>
                    <p className="text-slate-400 text-sm mb-3">Available now</p>
                    <div className="space-y-3">
                      {integrations.filter((item) => item.category === 'live').map((item) => {
                        const tone =
                          item.health === 'configured'
                            ? 'bg-green-400/10 text-green-400 border-green-400/20'
                            : item.health === 'partial'
                              ? 'bg-yellow-400/10 text-yellow-300 border-yellow-400/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                        return (
                          <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div>
                                <p className="text-slate-200 text-sm font-medium">{item.label}</p>
                                <p className="text-slate-400 text-sm mt-1">{item.summary}</p>
                              </div>
                              <span className={`badge capitalize border ${tone}`}>{item.health.replace('_', ' ')}</span>
                            </div>
                            {item.envKeys.length > 0 && (
                              <p className="text-[11px] text-slate-500">
                                Env keys: {item.envKeys.join(', ')}
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-3">Roadmap</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {integrations.filter((item) => item.category === 'roadmap').map((item) => (
                        <div key={item.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="text-slate-200 text-sm font-medium">{item.label}</p>
                            <span className="badge bg-slate-800 text-slate-400 border border-slate-700">planned</span>
                          </div>
                          <p className="text-slate-400 text-sm">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'security' && (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold text-slate-200">Security</h2>
              <div className="form-group">
                <label className="label">New password</label>
                <input type="password" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
                <button type="button" onClick={changePassword} className="btn-secondary mt-2">
                  Update password
                </button>
              </div>
              <p className="text-xs text-slate-500">2FA and session list: use your Supabase project auth settings.</p>
              <div className="pt-4 border-t border-slate-800">
                <button type="button" onClick={exportData} className="btn-secondary mb-4">
                  Download portfolio JSON
                </button>
                <div className="form-group">
                  <label className="label text-red-400">Delete account (type DELETE)</label>
                  <input className="input border-red-500/30" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)} />
                </div>
                <button type="button" onClick={deleteAccount} className="btn-danger w-full justify-center mt-2">
                  Permanently delete account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function LandlordSettingsClient() {
  return (
    <Suspense fallback={<div />}>
      <SettingsInner />
    </Suspense>
  )
}
