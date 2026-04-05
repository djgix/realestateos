'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

function InnerForm({ returnUrl }: { returnUrl: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setMsg(null)
    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: returnUrl },
    })
    setLoading(false)
    if (error) setMsg(error.message ?? 'Setup failed')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {msg && <p className="text-red-400 text-sm">{msg}</p>}
      <button type="submit" disabled={!stripe || loading} className="btn bg-brand-500 text-white w-full justify-center">
        {loading ? 'Saving…' : 'Save bank account'}
      </button>
    </form>
  )
}

export function TenantBankClient({
  tenantId,
  token,
  setupIntentId,
  setupIntentClientSecret,
  redirectStatus,
}: {
  tenantId: string
  token: string
  setupIntentId?: string
  setupIntentClientSecret?: string
  redirectStatus?: string
}) {
  const [options, setOptions] = useState<{ clientSecret: string; pk: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (setupIntentClientSecret) {
        const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
        if (!pk) {
          if (!cancelled) setErr('Stripe is not configured')
          return
        }
        const stripe = await loadStripe(pk)
        if (!stripe) {
          if (!cancelled) setErr('Could not load Stripe')
          return
        }
        const result = await stripe.retrieveSetupIntent(setupIntentClientSecret)
        const status = result.setupIntent?.status || redirectStatus || ''

        if (status === 'succeeded') {
          await fetch('/api/public/tenant-setup-complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId,
              token,
              setupIntentId,
              status,
            }),
          }).catch(() => undefined)
          if (!cancelled) {
            setNotice({
              tone: 'success',
              text: 'Bank account saved. Your landlord can now enable recurring ACH billing.',
            })
          }
          return
        }

        if (status === 'processing') {
          if (!cancelled) {
            setNotice({
              tone: 'success',
              text: 'Bank account submitted. Stripe is still processing verification.',
            })
          }
          return
        }

        if (!cancelled && (result.error?.message || status)) {
          setNotice({
            tone: 'warning',
            text: result.error?.message || 'Bank setup was not completed. You can try again below.',
          })
        }
      }

      const res = await fetch('/api/public/tenant-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, token }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (!cancelled) setErr(data.error || 'Could not start setup')
        return
      }
      if (!data.publishable_key || !data.client_secret) {
        if (!cancelled) setErr('Stripe is not configured')
        return
      }
      if (!cancelled) setOptions({ clientSecret: data.client_secret, pk: data.publishable_key })
    })()
    return () => {
      cancelled = true
    }
  }, [tenantId, token, setupIntentClientSecret, setupIntentId, redirectStatus])

  if (err) {
    return <p className="text-red-400">{err}</p>
  }
  if (notice && !options) {
    return (
      <div className={`rounded-xl border p-4 text-sm ${notice.tone === 'success' ? 'border-green-400/20 bg-green-400/5 text-green-300' : 'border-yellow-400/20 bg-yellow-400/5 text-yellow-200'}`}>
        {notice.text}
      </div>
    )
  }
  if (!options) {
    return <p className="text-slate-400">Loading secure form…</p>
  }

  const stripePromise = loadStripe(options.pk)
  const returnUrl = typeof window !== 'undefined' ? `${window.location.origin}/tenant/${tenantId}?t=${encodeURIComponent(token)}&setup=1` : ''

  return (
    <div className="space-y-4">
      {notice && (
        <div className={`rounded-xl border p-4 text-sm ${notice.tone === 'success' ? 'border-green-400/20 bg-green-400/5 text-green-300' : 'border-yellow-400/20 bg-yellow-400/5 text-yellow-200'}`}>
          {notice.text}
        </div>
      )}
      <Elements stripe={stripePromise} options={{ clientSecret: options.clientSecret }}>
        <InnerForm returnUrl={returnUrl} />
      </Elements>
    </div>
  )
}
