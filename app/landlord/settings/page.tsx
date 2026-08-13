'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  User, CreditCard, Bell, Shield, Building2, Check, Loader2,
  Wrench, DollarSign, Home, MessageSquare, Zap, Phone, Plus, Trash2, Eye, EyeOff, Download
} from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = [
  { id:'starter', name:'Starter', price:19, features:['2 properties','4 units','Rent collection','Lease generation'] },
  { id:'growth',  name:'Growth',  price:39, features:['10 properties','Unlimited units','Legal center','Schedule E','Priority email support'] },
  { id:'pro',     name:'Pro',     price:79, features:['Unlimited everything','Team access','Priority support','API access'] },
]

const DEFAULT_COLLECTIONS_CONFIG = {
  enabled: false,
  grace_days: 3,
  steps: [
    { day: 1, label: 'Friendly Reminder', channel: 'sms', auto_send: true, message: 'Hi {first_name}, just a reminder that your rent of {amount} was due. Please pay as soon as possible.' },
    { day: 5, label: 'Formal Notice', channel: 'email', auto_send: true, message: 'Dear {first_name}, your rent of {amount} is now {days_late} days overdue. Please remit payment immediately to avoid further action.' },
    { day: 14, label: 'Legal Notice', channel: 'email', auto_send: false, message: 'This is a formal notice that {amount} remains unpaid after {days_late} days. Failure to pay may result in eviction proceedings.' },
  ],
}

type CollectionStep = { day: number; label: string; channel: string; auto_send: boolean; message: string }
type CollectionsConfig = { enabled: boolean; grace_days: number; steps: CollectionStep[] }

function SettingsContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState(params.get('tab') || 'profile')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    late_rent: true, lease_expiry: true, maintenance: true,
    payment_received: true, lease_signed: true, weekly: true,
  })
  const [settings, setSettings] = useState<Record<string, any>>({
    automation: { auto_invite: true, maintenance_sms: true, weekly_digest: false, auto_payments: true },
    rent_defaults: { due_day: 1, late_fee: 50, late_fee_days: 5, security_deposit_multiplier: 1 },
    maintenance: { alert_threshold: 'always', auto_close_days: 0 },
    portal: { enabled: true, welcome_message: '', auto_invite: true },
    communications: { email_signature: '', reply_to: '', sms_opt_in: false },
  })
  const [collectionsConfig, setCollectionsConfig] = useState<CollectionsConfig>({ ...DEFAULT_COLLECTIONS_CONFIG })
  const [passwordForm, setPasswordForm] = useState({ current: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [savingNotif, setSavingNotif] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingCollections, setSavingCollections] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setForm({ full_name: data?.full_name || '', email: user.email || '', phone: data?.phone || '' })
      if (data?.notifications_config) setNotifications(data.notifications_config)
      if (data?.settings) setSettings((prev: any) => ({ ...prev, ...data.settings }))
      if (data?.collections_config) setCollectionsConfig(data.collections_config)
    }
    load()
    if (params.get('stripe') === 'success') toast.success('Bank account connected successfully!')
    if (params.get('upgraded') === 'true') toast.success('Plan upgraded successfully!')
  }, [])

  async function saveProfile() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone || null }).eq('id', user!.id)
    if (error) toast.error('Failed to update profile')
    else toast.success('Profile updated!')
    setLoading(false)
  }

  async function saveNotifications() {
    setSavingNotif(true)
    const res = await fetch('/api/landlord/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications }),
    })
    if (res.ok) toast.success('Notification preferences saved')
    else toast.error('Failed to save notification preferences')
    setSavingNotif(false)
  }

  async function saveSettings() {
    setSavingSettings(true)
    const res = await fetch('/api/landlord/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    })
    if (res.ok) toast.success('Settings saved')
    else toast.error('Failed to save settings')
    setSavingSettings(false)
  }

  async function saveCollections() {
    setSavingCollections(true)
    const res = await fetch('/api/landlord/settings/collections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectionsConfig),
    })
    if (res.ok) toast.success('Collections rules saved')
    else toast.error('Failed to save')
    setSavingCollections(false)
  }

  async function deleteAccount() {
    if (deleteConfirmText !== 'DELETE') { toast.error('Type DELETE to confirm'); return }
    setDeletingAccount(true)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (res.ok) {
        toast.success('Account deleted')
        window.location.href = '/'
      } else {
        const d = await res.json()
        toast.error(d.error || 'Failed to delete account')
      }
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeletingAccount(false)
    }
  }

  async function changePassword() {
    if (!passwordForm.password) { toast.error('Enter a new password'); return }
    if (passwordForm.password !== passwordForm.confirm) { toast.error('Passwords do not match'); return }
    if (passwordForm.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwordForm.password })
    if (error) toast.error(error.message)
    else { toast.success('Password changed successfully'); setPasswordForm({ current: '', password: '', confirm: '' }) }
    setSavingPassword(false)
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
    else { toast.error('Failed to connect bank account'); setConnectLoading(false) }
  }

  function addCollectionStep() {
    setCollectionsConfig(c => ({
      ...c,
      steps: [...c.steps, { day: 7, label: 'New Step', channel: 'email', auto_send: true, message: 'Hi {first_name}, your rent of {amount} is {days_late} days overdue.' }],
    }))
  }

  function removeCollectionStep(i: number) {
    setCollectionsConfig(c => ({ ...c, steps: c.steps.filter((_, idx) => idx !== i) }))
  }

  function updateStep(i: number, field: string, value: any) {
    setCollectionsConfig(c => ({
      ...c,
      steps: c.steps.map((s, idx) => idx === i ? { ...s, [field]: value } : s),
    }))
  }

  const TABS = [
    { id:'profile',       label:'Profile',        icon:User },
    { id:'billing',       label:'Billing',        icon:CreditCard },
    { id:'banking',       label:'Bank Account',   icon:Building2 },
    { id:'notifications', label:'Notifications',  icon:Bell },
    { id:'collections',   label:'Collections',    icon:DollarSign },
    { id:'automation',    label:'Automation',     icon:Zap },
    { id:'rent',          label:'Rent & Fees',    icon:Home },
    { id:'maintenance',   label:'Maintenance',    icon:Wrench },
    { id:'portal',        label:'Tenant Portal',  icon:Home },
    { id:'communications',label:'Messaging',      icon:MessageSquare },
    { id:'security',      label:'Security',       icon:Shield },
    { id:'export',        label:'Export Data',    icon:Download },
  ]

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-landlord" />
      </label>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, automations, and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-2 h-fit overflow-y-auto max-h-screen">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mb-0.5 ${tab === t.id ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="lg:col-span-3">
          {/* PROFILE */}
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
                  <input value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Email</label>
                  <input value={form.email} disabled className="input opacity-50 cursor-not-allowed" />
                </div>
                <div className="form-group">
                  <label className="label flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                    <span className="text-slate-600 font-normal text-xs">(required for SMS maintenance alerts)</span>
                  </label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="input" placeholder="+1 (555) 000-0000" />
                </div>
                <button onClick={saveProfile} disabled={loading} className="btn-landlord">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* BILLING */}
          {tab === 'billing' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-slate-200">Subscription</h2>
                  <span className="badge bg-landlord/10 text-landlord capitalize">{profile?.plan || 'trial'} plan</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {PLANS.map(plan => (
                    <div key={plan.id} className={`p-4 rounded-xl border transition-all ${profile?.plan === plan.id ? 'border-landlord/40 bg-landlord/5' : 'border-slate-800 hover:border-slate-700'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-200">{plan.name}</h3>
                        {profile?.plan === plan.id && <Check className="w-4 h-4 text-landlord" />}
                      </div>
                      <p className="font-display text-2xl text-slate-200 mb-3">${plan.price}<span className="text-slate-500 text-sm font-sans">/mo</span></p>
                      <ul className="space-y-1 mb-4">
                        {plan.features.map(f => (
                          <li key={f} className="text-xs text-slate-500 flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-landlord" /> {f}
                          </li>
                        ))}
                      </ul>
                      {profile?.plan !== plan.id && (
                        <button onClick={() => handleUpgrade(plan.id)} className="btn-secondary w-full text-xs justify-center py-2">
                          {(plan.price > (PLANS.find(p => p.id === profile?.plan)?.price || 0)) ? 'Upgrade' : 'Switch'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-600 mt-4 text-center">Cancel anytime · Billed monthly · No contracts</p>
              </div>
            </div>
          )}

          {/* BANKING */}
          {tab === 'banking' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">Rent Collection Banking</h2>
              <p className="text-slate-500 text-sm mb-6">Connect your bank account so tenants can pay rent directly through the app via ACH.</p>
              {profile?.stripe_account_status === 'active' ? (
                <div className="p-5 bg-green-400/5 border border-green-400/20 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Check className="w-5 h-5 text-green-400" />
                    <p className="font-semibold text-green-300">Bank account connected</p>
                  </div>
                  <p className="text-slate-500 text-sm">Tenants can now pay rent through the app. Funds arrive within 2–5 business days.</p>
                </div>
              ) : (
                <div>
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl mb-4">
                    <h3 className="font-medium text-slate-200 text-sm mb-2">What you get when connected:</h3>
                    <ul className="space-y-1.5">
                      {['Tenants pay online via ACH bank transfer','Funds deposit directly to your account','Automatic payment receipts to tenants','Full payment history in your dashboard','Late payment alerts sent automatically'].map(item => (
                        <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                          <Check className="w-3.5 h-3.5 text-landlord flex-shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Identity verification required (name, last 4 of SSN, bank account). Takes ~5 minutes.</p>
                  <button onClick={connectStripe} disabled={connectLoading} className="btn-landlord">
                    {connectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Building2 className="w-4 h-4" /> Connect Bank Account</>}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {tab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Notification Preferences</h2>
              <div className="space-y-1 mb-6">
                {[
                  { label:'Late rent payments', desc:'Alert when a tenant is past due', key:'late_rent' },
                  { label:'Lease expiring soon', desc:'60, 30, and 14 days before expiration', key:'lease_expiry' },
                  { label:'New maintenance request', desc:'When a tenant submits via portal', key:'maintenance' },
                  { label:'Payment received', desc:'Confirmation when rent is paid', key:'payment_received' },
                  { label:'Lease signed', desc:'When a tenant signs their lease', key:'lease_signed' },
                  { label:'Weekly summary', desc:'Portfolio health digest every Monday', key:'weekly' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between px-4 py-4 rounded-xl hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <Toggle checked={!!notifications[item.key]} onChange={v => setNotifications(n => ({...n, [item.key]: v}))} />
                  </div>
                ))}
              </div>
              <button onClick={saveNotifications} disabled={savingNotif} className="btn-landlord">
                {savingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Preferences'}
              </button>
            </div>
          )}

          {/* COLLECTIONS */}
          {tab === 'collections' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-200">Collections Autopilot</h2>
                    <p className="text-slate-500 text-sm mt-1">Automate late rent follow-ups. Rules fire daily based on how overdue a payment is.</p>
                  </div>
                  <Toggle checked={collectionsConfig.enabled} onChange={v => setCollectionsConfig(c => ({...c, enabled: v}))} />
                </div>
                <div className="mb-6">
                  <label className="label mb-3 flex items-center justify-between">
                    <span>Grace Period</span>
                    <span className="text-landlord font-semibold">{collectionsConfig.grace_days} day{collectionsConfig.grace_days !== 1 ? 's' : ''}</span>
                  </label>
                  <input type="range" min="0" max="10" value={collectionsConfig.grace_days}
                    onChange={e => setCollectionsConfig(c => ({...c, grace_days: parseInt(e.target.value)}))}
                    className="w-full accent-landlord" />
                  <p className="text-xs text-slate-600 mt-1">Days after due date before the first action fires</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Escalation Steps</h3>
                  <button onClick={addCollectionStep} className="btn-secondary text-xs py-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Step
                  </button>
                </div>
                {collectionsConfig.steps.map((step, i) => (
                  <div key={i} className="card p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400">{i+1}</span>
                        <input value={step.label} onChange={e => updateStep(i, 'label', e.target.value)} className="input py-1.5 text-sm font-medium w-48" />
                      </div>
                      <button onClick={() => removeCollectionStep(i)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Fires on day</label>
                        <input type="number" min="1" value={step.day} onChange={e => updateStep(i, 'day', parseInt(e.target.value))} className="input py-1.5 text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Channel</label>
                        <select value={step.channel} onChange={e => updateStep(i, 'channel', e.target.value)} className="select py-1.5 text-sm">
                          <option value="sms">SMS only</option>
                          <option value="email">Email only</option>
                          <option value="both">SMS + Email</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="text-xs text-slate-500 mb-1">Auto-send</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Toggle checked={step.auto_send} onChange={v => updateStep(i, 'auto_send', v)} />
                          <span className="text-xs text-slate-500">{step.auto_send ? 'Automatic' : 'Manual review'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Message <span className="text-slate-600">— vars: {'{first_name}'} {'{amount}'} {'{days_late}'} {'{property}'}</span></label>
                      <textarea value={step.message} onChange={e => updateStep(i, 'message', e.target.value)} rows={3} className="input resize-none text-sm" />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={saveCollections} disabled={savingCollections} className="btn-landlord">
                {savingCollections ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Collections Rules'}
              </button>
            </div>
          )}

          {/* AUTOMATION */}
          {tab === 'automation' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">Automation Settings</h2>
              <p className="text-slate-500 text-sm mb-6">Control which automated systems are active for your portfolio.</p>
              <div className="space-y-1">
                {[
                  { label:'Tenant portal auto-invite', desc:'Send portal invite automatically when a lease is activated', key:'auto_invite', group:'automation' },
                  { label:'Maintenance SMS alerts', desc:'Text you when tenants submit maintenance requests', key:'maintenance_sms', group:'automation' },
                  { label:'Weekly portfolio digest', desc:'Email summary every Monday morning', key:'weekly_digest', group:'automation' },
                  { label:'Auto-generate rent records', desc:'Create monthly rent payment records when a lease activates', key:'auto_payments', group:'automation' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between px-4 py-4 rounded-xl hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={!!settings.automation?.[item.key]}
                      onChange={v => setSettings((s: any) => ({ ...s, automation: { ...s.automation, [item.key]: v } }))}
                    />
                  </div>
                ))}
              </div>
              <button onClick={saveSettings} disabled={savingSettings} className="btn-landlord mt-6">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Automation Settings'}
              </button>
            </div>
          )}

          {/* RENT & FEES */}
          {tab === 'rent' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">Rent & Fee Defaults</h2>
              <p className="text-slate-500 text-sm mb-6">These values pre-fill when creating new leases. You can still override them per lease.</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="form-group">
                  <label className="label">Rent Due Day (1–28)</label>
                  <input type="number" min="1" max="28" value={settings.rent_defaults?.due_day || 1}
                    onChange={e => setSettings((s: any) => ({ ...s, rent_defaults: { ...s.rent_defaults, due_day: parseInt(e.target.value) } }))}
                    className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Default Late Fee ($)</label>
                  <input type="number" min="0" value={settings.rent_defaults?.late_fee || 50}
                    onChange={e => setSettings((s: any) => ({ ...s, rent_defaults: { ...s.rent_defaults, late_fee: parseFloat(e.target.value) } }))}
                    className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Late Fee Grace Period (days)</label>
                  <input type="number" min="0" value={settings.rent_defaults?.late_fee_days || 5}
                    onChange={e => setSettings((s: any) => ({ ...s, rent_defaults: { ...s.rent_defaults, late_fee_days: parseInt(e.target.value) } }))}
                    className="input" />
                </div>
                <div className="form-group">
                  <label className="label">Security Deposit (× monthly rent)</label>
                  <select value={settings.rent_defaults?.security_deposit_multiplier || 1}
                    onChange={e => setSettings((s: any) => ({ ...s, rent_defaults: { ...s.rent_defaults, security_deposit_multiplier: parseFloat(e.target.value) } }))}
                    className="select">
                    <option value="0.5">0.5× (half month)</option>
                    <option value="1">1× (one month)</option>
                    <option value="1.5">1.5× (one and a half months)</option>
                    <option value="2">2× (two months)</option>
                  </select>
                </div>
              </div>
              <button onClick={saveSettings} disabled={savingSettings} className="btn-landlord">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Defaults'}
              </button>
            </div>
          )}

          {/* MAINTENANCE */}
          {tab === 'maintenance' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">Maintenance Preferences</h2>
              <p className="text-slate-500 text-sm mb-6">Control how maintenance alerts and dispatch work.</p>
              <div className="space-y-5 mb-6">
                <div className="form-group">
                  <label className="label">SMS Alert Threshold</label>
                  <select value={settings.maintenance?.alert_threshold || 'always'}
                    onChange={e => setSettings((s: any) => ({ ...s, maintenance: { ...s.maintenance, alert_threshold: e.target.value } }))}
                    className="select">
                    <option value="always">Always — all requests</option>
                    <option value="high">High & Emergency only</option>
                    <option value="emergency">Emergency only</option>
                    <option value="never">Never (disable SMS alerts)</option>
                  </select>
                  <p className="text-xs text-slate-600 mt-1">Controls which tenant requests trigger an SMS to your phone</p>
                </div>
                <div className="form-group">
                  <label className="label">Auto-close Completed Requests (days)</label>
                  <input type="number" min="0" max="90" value={settings.maintenance?.auto_close_days || 0}
                    onChange={e => setSettings((s: any) => ({ ...s, maintenance: { ...s.maintenance, auto_close_days: parseInt(e.target.value) } }))}
                    className="input" placeholder="0 = manual only" />
                  <p className="text-xs text-slate-600 mt-1">Set to 0 to require manual close. Otherwise auto-closes N days after dispatch.</p>
                </div>
              </div>
              <button onClick={saveSettings} disabled={savingSettings} className="btn-landlord">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Maintenance Settings'}
              </button>
            </div>
          )}

          {/* TENANT PORTAL */}
          {tab === 'portal' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">Tenant Portal</h2>
              <p className="text-slate-500 text-sm mb-6">Configure your tenant-facing portal. Each tenant gets a unique private URL — no login required.</p>
              <div className="space-y-5 mb-6">
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Enable Tenant Portal</p>
                    <p className="text-xs text-slate-500">If disabled, tenant portal links return an error</p>
                  </div>
                  <Toggle checked={!!settings.portal?.enabled} onChange={v => setSettings((s: any) => ({ ...s, portal: { ...s.portal, enabled: v } }))} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Auto-invite on lease activation</p>
                    <p className="text-xs text-slate-500">Email tenant their portal link when you activate a lease</p>
                  </div>
                  <Toggle checked={!!settings.portal?.auto_invite} onChange={v => setSettings((s: any) => ({ ...s, portal: { ...s.portal, auto_invite: v } }))} />
                </div>
                <div className="form-group">
                  <label className="label">Portal Welcome Message</label>
                  <textarea
                    value={settings.portal?.welcome_message || ''}
                    onChange={e => setSettings((s: any) => ({ ...s, portal: { ...s.portal, welcome_message: e.target.value } }))}
                    rows={3} className="input resize-none"
                    placeholder="Welcome to your tenant portal! Use this to submit maintenance requests and pay rent." />
                  <p className="text-xs text-slate-600 mt-1">Shown at the top of each tenant's portal home page</p>
                </div>
              </div>
              <button onClick={saveSettings} disabled={savingSettings} className="btn-landlord">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Portal Settings'}
              </button>
            </div>
          )}

          {/* COMMUNICATIONS */}
          {tab === 'communications' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">Communications</h2>
              <p className="text-slate-500 text-sm mb-6">Customize how emails and SMS messages are sent from your account.</p>
              <div className="space-y-5 mb-6">
                <div className="form-group">
                  <label className="label">Email Reply-To Address</label>
                  <input type="email"
                    value={settings.communications?.reply_to || ''}
                    onChange={e => setSettings((s: any) => ({ ...s, communications: { ...s.communications, reply_to: e.target.value } }))}
                    className="input" placeholder={form.email || 'your@email.com'} />
                  <p className="text-xs text-slate-600 mt-1">Where tenant email replies are directed. Defaults to your account email.</p>
                </div>
                <div className="form-group">
                  <label className="label">Email Signature</label>
                  <textarea
                    value={settings.communications?.email_signature || ''}
                    onChange={e => setSettings((s: any) => ({ ...s, communications: { ...s.communications, email_signature: e.target.value } }))}
                    rows={3} className="input resize-none"
                    placeholder={`Best regards,\n${form.full_name || 'Your Name'}`} />
                  <p className="text-xs text-slate-600 mt-1">Appended to all outgoing tenant emails</p>
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">Require SMS opt-in from tenants</p>
                    <p className="text-xs text-slate-500">Tenants must confirm before receiving SMS messages</p>
                  </div>
                  <Toggle checked={!!settings.communications?.sms_opt_in} onChange={v => setSettings((s: any) => ({ ...s, communications: { ...s.communications, sms_opt_in: v } }))} />
                </div>
              </div>
              <button onClick={saveSettings} disabled={savingSettings} className="btn-landlord">
                {savingSettings ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Communications'}
              </button>
            </div>
          )}

          {/* SECURITY */}
          {tab === 'security' && (
            <div className="space-y-4">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-200 mb-6">Change Password</h2>
                <div className="space-y-4">
                  <div className="form-group">
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} value={passwordForm.password}
                        onChange={e => setPasswordForm(f => ({...f, password: e.target.value}))}
                        className="input pr-10" placeholder="Min. 8 characters" />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="label">Confirm New Password</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? 'text' : 'password'} value={passwordForm.confirm}
                        onChange={e => setPasswordForm(f => ({...f, confirm: e.target.value}))}
                        className="input pr-10" />
                      <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button onClick={changePassword} disabled={savingPassword} className="btn-landlord">
                    {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
                  </button>
                </div>
              </div>

              <div className="card p-6 border-red-500/20">
                <h2 className="text-lg font-semibold text-slate-200 mb-2">Danger Zone</h2>
                <p className="text-slate-500 text-sm mb-4">Permanently delete your account and all associated data. This cannot be undone.</p>
                <div className="form-group mb-3">
                  <label className="label text-red-400/80">Type DELETE to confirm</label>
                  <input value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)}
                    className="input border-red-500/20 focus:border-red-500/40" placeholder="DELETE" />
                </div>
                <button onClick={deleteAccount} disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                  className="btn-danger">
                  {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Account'}
                </button>
              </div>
            </div>
          )}
          {/* EXPORT DATA */}
          {tab === 'export' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-2">Export Your Data</h2>
              <p className="text-slate-500 text-sm mb-6">Download your data as CSV files for use in spreadsheets or accounting software.</p>
              <div className="space-y-3">
                {[
                  { label: 'Payment History', desc: 'All rent payments, statuses, dates, and amounts', href: '/api/export/payments' },
                  { label: 'Expenses', desc: 'All expenses with categories and tax-deductible flags', href: '/api/export/expenses' },
                  { label: 'Tenant Directory', desc: 'All tenants with contact info and status', href: '/api/export/tenants' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <a href={item.href} download className="btn-secondary text-xs">
                      <Download className="w-3.5 h-3.5" /> Download CSV
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div />}>
      <SettingsContent />
    </Suspense>
  )
}
