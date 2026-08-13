'use client'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { productDashboardPath } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [dest, setDest] = useState<string | null>(null)
  const [sessionStuck, setSessionStuck] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current)
  }, [])

  function scheduleRedirect(target: string) {
    setSessionStuck(false)
    setDest(target)
    redirectTimer.current = setTimeout(() => router.push(target), 2000)
  }

  function handleContinueClick() {
    if (redirectTimer.current) clearTimeout(redirectTimer.current)
  }

  // Looks up the profile for the already-authenticated session and routes to its
  // dashboard. Password update itself doesn't call this directly — it always leaves a
  // valid session (that's the whole point of the recovery flow), so on a lookup failure
  // there is nothing to sign out of or route around; retrying this same lookup is the
  // correct recovery action, not a forced local sign-out (which, per auth-js, isn't
  // actually reliable without a network round-trip anyway) or asking them to close the tab.
  async function checkAccountAndRedirect() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // No session at all (rare here, but possible if it expired mid-flow) — this is the
      // one case a plain sign-in redirect is actually correct.
      scheduleRedirect('/auth/login')
      return
    }
    const { data: profile, error: profileError } = await supabase.from('profiles').select('product').eq('id', user.id).single()
    if (profileError) {
      setSessionStuck(true)
      return
    }
    scheduleRedirect(productDashboardPath(profile?.product))
  }

  async function handleRetry() {
    setRetrying(true)
    await checkAccountAndRedirect()
    setRetrying(false)
  }

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
      await checkAccountAndRedirect()
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
          {sessionStuck ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="font-display text-xl text-slate-200 mb-2">Password updated!</h2>
              <p className="text-slate-500 text-sm mb-4">
                We couldn't load your account just now. You're still signed in — try again.
              </p>
              {/* No generic "go to dashboard" fallback here: which dashboard is exactly
                  what the failed lookup below couldn't tell us, so a hardcoded link would
                  misroute a seller or buyer straight to the landlord dashboard. */}
              <button onClick={handleRetry} disabled={retrying} className="btn-primary py-2 px-6">
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Try again'}
              </button>
            </div>
          ) : done ? (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="font-display text-xl text-slate-200 mb-2">Password updated!</h2>
              <p className="text-slate-500 text-sm mb-4">
                {dest === '/auth/login' ? 'Please sign in to continue.' : dest ? 'Redirecting you to your dashboard...' : 'Loading your account...'}
              </p>
              {dest && (
                <Link href={dest} onClick={handleContinueClick} className="text-brand-400 hover:text-brand-300 text-sm">
                  Continue now →
                </Link>
              )}
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
