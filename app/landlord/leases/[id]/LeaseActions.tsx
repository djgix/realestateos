'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

export function LeaseActions({ leaseId, hasSubscription }: { leaseId: string; hasSubscription: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function startSubscription() {
    setLoading(true)
    try {
      const res = await fetch(`/api/leases/${leaseId}/start-subscription`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Could not start subscription')
        return
      }
      if (data.hosted_invoice_url) {
        window.location.href = data.hosted_invoice_url
        return
      }
      toast.success('Subscription created. Open Stripe Dashboard if the tenant still needs to add a bank account.')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (hasSubscription) {
    return <p className="text-sm text-green-400">Recurring billing is active on Stripe.</p>
  }

  return (
    <button type="button" onClick={startSubscription} disabled={loading} className="btn-landlord text-sm">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
      Start recurring rent (Stripe)
    </button>
  )
}
