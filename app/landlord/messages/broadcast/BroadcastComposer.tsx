'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

type TenantOption = {
  id: string
  property_id: string | null
  first_name: string
  last_name: string
  status: string
  properties?: { name?: string | null } | null
}

export function BroadcastComposer({
  ownerId,
  tenants,
}: {
  ownerId: string
  tenants: TenantOption[]
}) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>(
    tenants.filter((tenant) => tenant.status === 'active').map((tenant) => tenant.id)
  )
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const selectedTenants = useMemo(
    () => tenants.filter((tenant) => selectedIds.includes(tenant.id)),
    [selectedIds, tenants]
  )

  function toggleTenant(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    )
  }

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedIds.length) {
      toast.error('Select at least one tenant')
      return
    }
    if (!body.trim()) {
      toast.error('Write a message first')
      return
    }

    setSending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('messages').insert(
        selectedTenants.map((tenant) => ({
          owner_id: ownerId,
          tenant_id: tenant.id,
          property_id: tenant.property_id,
          sender: 'owner',
          subject: subject || null,
          body,
          read: true,
        }))
      )
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success(`Broadcast sent to ${selectedTenants.length} tenant${selectedTenants.length === 1 ? '' : 's'}`)
      router.push('/landlord/messages')
      router.refresh()
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={sendBroadcast} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="card p-6 space-y-4">
        <div className="form-group">
          <label className="label">Subject</label>
          <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Portfolio update" />
        </div>
        <div className="form-group">
          <label className="label">Message</label>
          <textarea className="textarea min-h-[220px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write a message to all selected tenants..." />
        </div>
        <button type="submit" disabled={sending} className="btn-landlord">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send broadcast
        </button>
      </div>

      <div className="card p-6 space-y-3">
        <h2 className="section-title">Recipients</h2>
        {tenants.map((tenant) => (
          <label key={tenant.id} className="flex items-start gap-3 rounded-xl bg-slate-800/40 p-3">
            <input type="checkbox" checked={selectedIds.includes(tenant.id)} onChange={() => toggleTenant(tenant.id)} />
            <div>
              <p className="text-sm text-slate-200">{tenant.first_name} {tenant.last_name}</p>
              <p className="text-xs text-slate-500">
                {tenant.properties?.name || 'No property'} · {tenant.status}
              </p>
            </div>
          </label>
        ))}
      </div>
    </form>
  )
}
