'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LeaseActions({ lease }: { lease: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function updateStatus(status: string) {
    setLoading(status)
    const supabase = createClient()
    const { error } = await supabase
      .from('leases')
      .update({ status })
      .eq('id', lease.id)

    if (error) {
      toast.error('Failed to update lease')
    } else {
      toast.success(`Lease ${status}`)
      router.refresh()
    }
    setLoading(null)
  }

  async function activateLease() {
    setLoading('activate')
    const supabase = createClient()

    // Activate the lease
    await supabase.from('leases').update({ status: 'active' }).eq('id', lease.id)

    // Auto-generate 12 months of rent payment records
    const records = []
    const startDate = new Date(lease.start_date)
    const dueDay = lease.rent_due_day || 1

    for (let i = 0; i < 12; i++) {
      const dueDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, dueDay)
      if (dueDate > new Date(lease.end_date)) break
      records.push({
        owner_id: lease.owner_id,
        property_id: lease.property_id,
        tenant_id: lease.tenant_id,
        lease_id: lease.id,
        amount: lease.monthly_rent,
        total_amount: lease.monthly_rent,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending',
        collections_actions_sent: [],
      })
    }

    if (records.length > 0) {
      await supabase.from('rent_payments').insert(records)
    }

    // Send tenant portal invite
    await fetch('/api/landlord/leases/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lease_id: lease.id }),
    })

    toast.success('Lease activated! Tenant portal invite sent.')
    setLoading(null)
    router.refresh()
  }

  if (lease.status === 'terminated' || lease.status === 'expired') {
    return null
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="section-title">Actions</h2>
      {lease.status === 'draft' || lease.status === 'sent' ? (
        <button
          onClick={activateLease}
          disabled={!!loading}
          className="btn bg-green-500 hover:bg-green-400 text-white w-full justify-center"
        >
          {loading === 'activate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          Activate Lease
        </button>
      ) : null}

      {lease.status === 'active' && (
        <button
          onClick={() => {
            if (confirm('Terminate this lease? This cannot be undone.')) {
              updateStatus('terminated')
            }
          }}
          disabled={!!loading}
          className="btn-secondary w-full justify-center text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
        >
          {loading === 'terminated' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
          Terminate Lease
        </button>
      )}
    </div>
  )
}
