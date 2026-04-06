'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, Bell, Loader2, Check, Phone } from 'lucide-react'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'billing', label: 'Billing', icon: CreditCard },
]

export default function BuyerSettingsPage() {
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '' })
  const [notifications, setNotifications] = useState({
    new_listing_match: true,
    price_drop: true,
    offer_status: true,
    showing_confirmed: true,
  })
  const [loading, setLoading] = useState(false)
  const [savingNotif, setSavingNotif] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
      setForm({ full_name: data?.full_name || '', email: user.email || '', phone: data?.phone || '' })
      if (data?.notifications_config) setNotifications((prev: any) => ({ ...prev, ...data.notifications_config }))
    }
    load()
  }, [])

  async function save() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone || null }).eq('id', user!.id)
    toast.success('Saved!')
    setLoading(false)
  }

  async function saveNotifications() {
    setSavingNotif(true)
    await fetch('/api/landlord/settings/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notifications }),
    })
    toast.success('Notification preferences saved')
    setSavingNotif(false)
  }

  async function checkout() {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product: 'buyer' }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-10 h-5 bg-slate-700 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-buyer" />
      </label>
    )
  }

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
          {tab === 'profile' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Profile Information</h2>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="label">Full Name</label>
                  <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Email</label>
                  <input className="input opacity-50" value={form.email} disabled />
                </div>
                <div className="form-group">
                  <label className="label flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Phone Number</label>
                  <input type="tel" className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
                </div>
                <button onClick={save} disabled={loading} className="btn-buyer">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save changes</>}
                </button>
              </div>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Notification Preferences</h2>
              <div className="space-y-4">
                {[
                  { key: 'new_listing_match', label: 'New listing match', desc: 'Get notified when a listing matches your search criteria' },
                  { key: 'price_drop', label: 'Price drop alert', desc: 'Get notified when a saved listing drops in price' },
                  { key: 'offer_status', label: 'Offer status updates', desc: 'Get notified when your offer status changes' },
                  { key: 'showing_confirmed', label: 'Showing confirmed', desc: 'Get notified when a showing is confirmed' },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={v => setNotifications(n => ({ ...n, [item.key]: v }))}
                    />
                  </div>
                ))}
                <button onClick={saveNotifications} disabled={savingNotif} className="btn-buyer">
                  {savingNotif ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Preferences'}
                </button>
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-200 mb-6">Subscription</h2>
              <div className="mb-6 p-4 bg-buyer/10 border border-buyer/20 rounded-xl text-center">
                <p className="text-xs text-slate-500 mb-1">Current plan</p>
                <p className="font-display text-2xl text-buyer capitalize">{profile?.plan || 'trial'}</p>
              </div>
              {profile?.plan !== 'paid' && (
                <div>
                  <p className="text-slate-400 text-sm mb-4">Unlock the full BuyerOS platform to manage your home search and offers.</p>
                  <button onClick={checkout} className="btn-buyer">
                    Activate BuyerOS — $149
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
