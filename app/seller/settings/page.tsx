'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, CreditCard, Bell, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SellerSettingsPage() {
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState({ full_name: '', email: '' })
  const [loading, setLoading] = useState(false)

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
  }, [])

  async function save() {
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ full_name: form.full_name }).eq('id', user!.id)
    toast.success('Saved!')
    setLoading(false)
  }

  async function checkout(product: string, plan?: string) {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product, plan }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="section-title flex items-center gap-2"><User className="w-4 h-4" /> Profile</h2>
            <div className="space-y-4">
              <div className="form-group">
                <label className="label">Full Name</label>
                <input className="input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input className="input opacity-50" value={form.email} disabled />
              </div>
              <button onClick={save} disabled={loading} className="btn-seller">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save changes</>}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="section-title flex items-center gap-2"><CreditCard className="w-4 h-4" /> Plan</h2>
            <div className="mb-4 p-3 bg-seller/10 border border-seller/20 rounded-xl text-center">
              <p className="text-xs text-slate-500 mb-1">Current plan</p>
              <p className="font-display text-xl text-seller capitalize">{profile?.plan || 'trial'}</p>
            </div>
            {profile?.plan !== 'paid' && (
              <button onClick={() => checkout('seller')} className="btn-seller w-full justify-center text-sm">
                Activate SellerOS — $299
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
