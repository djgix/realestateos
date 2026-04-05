'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, DollarSign, Loader2, CheckCircle, Lock } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function PayRentPage() {
  const params = useParams()
  const token = params.token as string
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    // Fetch tenant's next pending payment info via the portal token
    fetch(`/api/tenant/${token}/payment-info`)
      .then(r => r.json())
      .then(data => {
        setPaymentInfo(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  async function handlePay() {
    if (!paymentInfo?.payment_id) return
    setPaying(true)
    try {
      const res = await fetch('/api/rent/collect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_id: paymentInfo.payment_id }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.success) {
        setPaid(true)
      } else {
        toast.error(data.error || 'Payment failed. Please try again.')
      }
    } catch {
      toast.error('Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
      </div>
    )
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl text-slate-100 mb-2">Payment Successful!</h1>
          <p className="text-slate-400 text-sm mb-6">You'll receive a receipt by email shortly.</p>
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
            <DollarSign className="w-5 h-5 text-green-400" />
            <h1 className="font-semibold text-slate-200">Pay Rent</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {!paymentInfo?.payment_id ? (
          <div className="card p-8 text-center">
            <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <h2 className="font-display text-xl text-slate-200 mb-2">You're all caught up!</h2>
            <p className="text-slate-500 text-sm">No outstanding payments at this time.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Payment Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Property</span>
                  <span className="text-slate-200 text-sm">{paymentInfo.property_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Period</span>
                  <span className="text-slate-200 text-sm">{paymentInfo.period}</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-3">
                  <span className="text-slate-300 font-semibold">Total Due</span>
                  <span className="text-2xl font-display text-white">${paymentInfo.amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={paying}
              className="w-full bg-green-500 hover:bg-green-400 text-white py-4 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
            >
              {paying ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : <><DollarSign className="w-5 h-5" /> Pay ${paymentInfo.amount?.toLocaleString()}</>}
            </button>

            <div className="flex items-center gap-2 justify-center text-slate-600 text-xs">
              <Lock className="w-3 h-3" />
              Secured by Stripe · ACH bank transfer
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
