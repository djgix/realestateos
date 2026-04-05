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
  properties?: { name?: string | null } | null
}

export function MessageComposer({
  ownerId,
  tenants,
  defaultTemplate = '',
}: {
  ownerId: string
  tenants: TenantOption[]
  defaultTemplate?: string
}) {
  const router = useRouter()
  const [tenantId, setTenantId] = useState(tenants[0]?.id || '')
  const [subject, setSubject] = useState(defaultTemplate || '')
  const [body, setBody] = useState(defaultTemplate ? `${defaultTemplate}\n\n` : '')
  const [sending, setSending] = useState(false)

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === tenantId) || null,
    [tenantId, tenants]
  )

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) {
      toast.error('Select a tenant first')
      return
    }
    setSending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('messages').insert({
        owner_id: ownerId,
        tenant_id: tenantId,
        property_id: selectedTenant?.property_id ?? null,
        sender: 'owner',
        subject: subject || null,
        body,
        read: true,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Message sent')
      router.push(`/landlord/messages/${tenantId}`)
      router.refresh()
    } finally {
      setSending(false)
    }
  }

  if (!tenants.length) {
    return (
      <div className="card p-8 text-center text-slate-500">
        Add a tenant before sending messages.
      </div>
    )
  }

  return (
    <form onSubmit={sendMessage} className="card p-6 space-y-4">
      <div className="form-group">
        <label className="label">Tenant</label>
        <select className="select" value={tenantId} onChange={(e) => setTenantId(e.target.value)}>
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.first_name} {tenant.last_name}{tenant.properties?.name ? ` · ${tenant.properties.name}` : ''}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label className="label">Subject</label>
        <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Rent reminder" />
      </div>
      <div className="form-group">
        <label className="label">Message</label>
        <textarea className="textarea min-h-[180px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." />
      </div>
      <button type="submit" disabled={sending} className="btn-landlord">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send message
      </button>
    </form>
  )
}
