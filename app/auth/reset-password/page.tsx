'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      setDone(true)
      const { data: { user } } = await supabase.auth.getUser()
      const { data: profile } = user
        ? await supabase.from('profiles').select('product').eq('id', user.id).single()
        : { data: null }
      const dest = profile?.product === 'seller' ? '/seller/dashboard'
                 : profile?.product === 'buyer'  ? '/buyer/dashboard'
                 : '/landlord/dashboard'
      setTimeout(() => router.push(dest), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-display text-2xl text-white mb-6">
            REAL<span className="text-brand-400">ESTATE</span>os
          </Link>
          <h1 className="font-display text-3xl text-white mb-2">Set new password</h1>
          <p className="text-slate-500">Choose a strong password for your account</p>
        </div>

        <div className="card p-8">
          {done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="font-display text-xl text-slate-200 mb-2">Password updated!</h2>
              <p className="text-slate-500 text-sm">Redirecting you to your dashboard...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label">New password</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="input pr-10"
                  />
                  <button type="button" onClick={() => setShow(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label className="label">Confirm new password</label>
                <input
                  type={show ? 'text' : 'password'}
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  className="input"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
