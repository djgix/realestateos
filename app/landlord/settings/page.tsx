'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, Bell, Shield, Building2, Check, Loader2, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = [
  { id:'starter', name:'Starter', price:19, features:['2 properties','4 units','Rent collection','Lease generation'] },
  { id:'growth',  name:'Growth',  price:39, features:['10 properties','Unlimited units','Legal center','Schedule E','Background checks'] },
  { id:'pro',     name:'Pro',     price:79, features:['Unlimited everything','Team access','Priority support','API access'] },
]

function SettingsContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [tab, setTab] = useState(params.get('tab') || 'profile')
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [connectLoading, setConnectLoading] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '' })

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setForm({ full_name: data?.full_name || '', email: user.email || '' })
    }
    load()

    // Handle stripe return
    if (params.get('stripe') === 'success') toast.success('Bank account connected successfully!')
    if (params.get('upgraded') === 'true') toast.success('Plan upgraded successfully!')
  }, [])

  async function saveProfile() {
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', user!.id)
    toast.success('Profile updated!')
    setLoading(false)
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

  const TABS = [
    { id:'profile',  label:'Profile',      icon:User },
    { id:'billing',  label:'Billing',      icon:CreditCard },
    { id:'banking',  label:'Rent Banking', icon:Building2 },
    { id:'notifications', label:'Notifications', icon:Bell },
    { id:'security', label:'Security',     icon:Shield },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="card p-2 h-fit">
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
                  <h2 className="text-lg font-semibold text-slate-200">Current Plan</h2>
                  <span className="badge bg-landlord/10 text-landlord capitalize">{profile?.plan || 'trial'}</span>
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
                <p className="text-xs text-slate-500 mt-4 text-center">Billing powered by <strong className="text-slate-400">Polar.sh</strong> · Cancel anytime</p>
              </div>
            </div>
          )}

          {/* BANKING / STRIPE CONNECT */}
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
                  <p className="text-slate-500 text-sm">Tenants can now pay rent through the app. Funds arrive in your account within 2–5 business days.</p>
                </div>
              ) : (
                <div>
                  <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl mb-4">
                    <h3 className="font-medium text-slate-200 text-sm mb-2">What happens when you connect:</h3>
                    <ul className="space-y-1.5">
                      {[
                        'Tenants can pay rent online via ACH bank transfer',
                        'Funds deposit directly to your connected bank account',
                        'Automatic payment receipts sent to tenants',
                        'Payment history tracked in your dashboard',
                        'Late payment alerts sent automatically',
                      ].map(item => (
                        <li key={item} className="flex items-center gap-2 text-xs text-slate-400">
                          <Check className="w-3.5 h-3.5 text-landlord flex-shrink-0" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">You'll need to verify your identity with Stripe (name, last 4 of SSN, bank account). Takes about 5 minutes. Required by federal law.</p>
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
              <div className="space-y-1">
                {[
                  { label:'Late rent payments', desc:'Alert when a tenant is late', key:'late_rent' },
                  { label:'Lease expiring soon', desc:'60, 30, and 14 days before expiration', key:'lease_expiry' },
                  { label:'New maintenance request', desc:'When a tenant submits a request', key:'maintenance' },
                  { label:'Payment received', desc:'Confirmation when rent is paid', key:'payment_received' },
                  { label:'Lease signed', desc:'When a tenant signs their lease', key:'lease_signed' },
                  { label:'Weekly summary', desc:'Portfolio health digest every Monday', key:'weekly' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between px-4 py-4 rounded-xl hover:bg-slate-800/40 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-landlord"></div>
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-6">Emails sent via <strong className="text-slate-400">Resend</strong></p>
            </div>
          )}

          {/* SECURITY */}
          {tab === 'security' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Security</h2>
              <div className="space-y-4">
                {[
                  { label:'Password', desc:'Last changed — unknown', action:'Change password' },
                  { label:'Two-factor authentication', desc:'Add an extra layer of security', action:'Enable 2FA' },
                  { label:'Active sessions', desc:'Manage where you\'re logged in', action:'View sessions' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <button className="btn-secondary text-sm">{item.action}</button>
                  </div>
                ))}
                <div className="mt-6 pt-6 border-t border-slate-800">
                  <button className="btn-danger w-full justify-center">Delete Account</button>
                  <p className="text-xs text-slate-600 text-center mt-2">Permanently deletes all your data. Cannot be undone.</p>
                </div>
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
