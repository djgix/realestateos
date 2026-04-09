'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2, RotateCcw, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

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
      setLoading(null)
      return
    }

    // Cancel all future pending payments when terminating
    if (status === 'terminated') {
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('rent_payments')
        .update({ status: 'cancelled' })
        .eq('tenant_id', lease.tenant_id)
        .eq('status', 'pending')
        .gte('due_date', today)
      toast.success('Lease terminated. Future payments cancelled.')
    } else {
      toast.success(`Lease ${status}`)
    }
    router.refresh()
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

  async function deleteDraft() {
    if (!confirm('Delete this draft lease? This cannot be undone.')) return
    setLoading('delete')
    const res = await fetch(`/api/landlord/leases/${lease.id}/delete`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Draft deleted')
      router.push('/landlord/leases')
    } else {
      const data = await res.json()
      toast.error(data.error || 'Failed to delete')
      setLoading(null)
    }
  }

  if (lease.status === 'terminated' || lease.status === 'expired') {
    return null
  }

  return (
    <div className="card p-5 space-y-3">
      <h2 className="section-title">Actions</h2>
      {lease.status === 'draft' || lease.status === 'sent' ? (
        <div className="space-y-2">
          <button
            onClick={activateLease}
            disabled={!!loading}
            className="btn bg-green-500 hover:bg-green-400 text-white w-full justify-center"
          >
            {loading === 'activate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Activate Lease
          </button>
          {lease.status === 'draft' && (
            <button
              onClick={deleteDraft}
              disabled={!!loading}
              className="btn-secondary w-full justify-center text-red-400 hover:text-red-300 border-red-400/20 hover:border-red-400/40"
            >
              {loading === 'delete' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete Draft
            </button>
          )}
        </div>
      ) : null}

      {lease.status === 'active' && (
        <div className="space-y-2">
          <Link
            href={`/landlord/leases/${lease.id}/renew`}
            className="btn-landlord w-full justify-center"
          >
            <RotateCcw className="w-4 h-4" /> Renew Lease
          </Link>
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
        </div>
      )}
    </div>
  )
}
