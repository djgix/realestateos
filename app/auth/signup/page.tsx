'use client'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, Loader2, Check, Building2, Home, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const PRODUCTS = [
  { id:'landlord', label:'LandlordOS', sublabel:'I own rentals', icon:Building2, color:'text-landlord', border:'border-landlord/40 bg-landlord/5' },
  { id:'seller',   label:'SellerOS',   sublabel:'Selling my home', icon:Home,     color:'text-seller',   border:'border-seller/40 bg-seller/5' },
  { id:'buyer',    label:'BuyerOS',    sublabel:'Buying a home',   icon:Search,   color:'text-buyer',    border:'border-buyer/40 bg-buyer/5' },
]

function SignupContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [product, setProduct] = useState(params.get('product') || 'landlord')
  const [form, setForm] = useState({ fullName:'', email:'', password:'' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)

  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleGoogle() {
    setGoogleLoading(true)
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?product=${encodeURIComponent(product)}` },
    })
    if (error) { toast.error(error.message); setGoogleLoading(false) }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setLoading(true)
    const supabase = await createClient()
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.fullName, product } }
    })
    if (error) { toast.error(error.message); setLoading(false) }
    else {
      await supabase.from('profiles').update({
        product,
        collections_config: {
          enabled: false,
          grace_days: 3,
          steps: [
            { day: 1, label: 'Friendly Reminder', channel: 'sms', auto_send: true, message: 'Hi {first_name}, just a friendly reminder that your rent of {amount} was due. Please pay at your earliest convenience.' },
            { day: 5, label: 'Formal Notice', channel: 'email', auto_send: true, message: 'Dear {first_name}, your rent of {amount} is now {days_late} days overdue. Please remit payment immediately to avoid further action.' },
            { day: 14, label: 'Legal Notice', channel: 'email', auto_send: false, message: 'This is a formal notice that {amount} remains unpaid after {days_late} days. Failure to pay may result in eviction proceedings.' },
          ],
        },
      }).eq('email', form.email)
      toast.success('Account created!')
      const dest = product === 'seller' ? '/seller/dashboard' : product === 'buyer' ? '/buyer/dashboard' : '/landlord/dashboard'
      router.push(dest)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-display text-2xl text-white mb-6">
            REAL<span className="text-brand-400">ESTATE</span>os
          </Link>
          <h1 className="font-display text-3xl text-white mb-2">Create your account</h1>
          <p className="text-slate-500">14-day free trial · No credit card needed</p>
        </div>

        <div className="card p-8">
          {/* GOOGLE */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-900 font-medium py-3 px-4 rounded-xl transition-all mb-5 disabled:opacity-50"
          >
            {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-600 text-sm">or sign up with email</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Product selector */}
          <div className="mb-6">
            <p className="label mb-3">Which product do you need?</p>
            <div className="grid grid-cols-3 gap-2">
              {PRODUCTS.map(p => (
                <button key={p.id} type="button" onClick={() => setProduct(p.id)}
                  className={`p-3 rounded-xl border text-center transition-all ${product === p.id ? p.border : 'border-slate-700 hover:border-slate-600'}`}>
                  <p.icon className={`w-5 h-5 mx-auto mb-1.5 ${product === p.id ? p.color : 'text-slate-500'}`} />
                  <p className={`text-xs font-semibold ${product === p.id ? p.color : 'text-slate-500'}`}>{p.label}</p>
                  <p className="text-xs text-slate-600">{p.sublabel}</p>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="form-group">
              <label className="label">Full name</label>
              <input type="text" required value={form.fullName} onChange={e => setForm({...form, fullName:e.target.value})} placeholder="John Smith" className="input" />
            </div>
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})} placeholder="you@example.com" className="input" />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required value={form.password} onChange={e => setForm({...form, password:e.target.value})} placeholder="Min. 8 characters" className="input pr-12" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400">
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
            </button>
          </form>

          <ul className="mt-5 space-y-2">
            {['14-day free trial included', 'No credit card required', 'Cancel anytime'].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm text-slate-500">
                <Check className="w-4 h-4 text-brand-400" /> {item}
              </li>
            ))}
          </ul>

          <p className="text-center text-slate-500 text-sm mt-6 pt-6 border-t border-slate-800">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
      <SignupContent />
    </Suspense>
  )
}
