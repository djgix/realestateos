'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

const APP = typeof window !== 'undefined' ? window.location.origin : ''

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })
    if (error) {
      toast.error(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-display text-2xl text-white mb-6">
            REAL<span className="text-brand-400">ESTATE</span>os
          </Link>
          <h1 className="font-display text-3xl text-white mb-2">Forgot password?</h1>
          <p className="text-slate-500">We'll send you a reset link</p>
        </div>

        <div className="card p-8">
          {sent ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="font-display text-xl text-slate-200 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm mb-6">
                We sent a password reset link to <strong className="text-slate-300">{email}</strong>
              </p>
              <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 text-sm">
                ← Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-group">
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input pl-10"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send reset link'}
              </button>
              <div className="text-center">
                <Link href="/auth/login" className="text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
