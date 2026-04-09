'use client'
import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, Loader2, CheckCircle, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

function PaymentSetupContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const token = params.token as string
  const success = searchParams.get('success') === '1'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function startSetup() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/tenant/${token}/setup-intent`, { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Failed to start setup. Please try again.')
        setLoading(false)
      }
    } catch {
      setError('Failed to start setup. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-slate-100 mb-2">Bank account linked!</h1>
          <p className="text-slate-400 text-sm mb-6">Your payment method is set up. You can now pay rent online.</p>
          <Link href={`/tenant/${token}`} className="bg-landlord text-white px-6 py-3 rounded-xl font-semibold inline-block">
            Back to Portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/tenant/${token}`} className="text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-400" />
            <h1 className="font-semibold text-slate-200">Add Payment Method</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10 space-y-4">
        <div className="card p-6">
          <h2 className="font-display text-xl text-slate-100 mb-2">Link your bank account</h2>
          <p className="text-slate-400 text-sm mb-6">Connect your bank account to pay rent securely online via ACH bank transfer. No card fees — free to use.</p>

          <div className="space-y-3 mb-6">
            {[
              'No credit card required — bank transfer only',
              'Bank-level encryption via Stripe',
              'Funds debited on payment date',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-400">
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-xl text-red-400 text-sm mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <button
            onClick={startSetup}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</> : <><Building2 className="w-5 h-5" /> Link Bank Account</>}
          </button>

          <div className="flex items-center gap-2 justify-center text-slate-600 text-xs mt-4">
            <Lock className="w-3 h-3" />
            Secured by Stripe
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>}>
      <PaymentSetupContent />
    </Suspense>
  )
}
