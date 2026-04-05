'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

export function ThreadReplyBox({
  ownerId,
  tenantId,
  propertyId,
}: {
  ownerId: string
  tenantId: string
  propertyId: string | null
}) {
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function sendReply(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) {
      toast.error('Write a reply first')
      return
    }
    setSending(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('messages').insert({
        owner_id: ownerId,
        tenant_id: tenantId,
        property_id: propertyId,
        sender: 'owner',
        subject: subject || null,
        body,
        read: true,
      })
      if (error) {
        toast.error(error.message)
        return
      }
      setSubject('')
      setBody('')
      toast.success('Reply sent')
      router.refresh()
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={sendReply} className="card p-6 space-y-4">
      <h2 className="section-title">Reply</h2>
      <div className="form-group">
        <label className="label">Subject (optional)</label>
        <input className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Follow-up" />
      </div>
      <div className="form-group">
        <label className="label">Message</label>
        <textarea className="textarea min-h-[160px]" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your reply..." />
      </div>
      <button type="submit" disabled={sending} className="btn-landlord">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Send reply
      </button>
    </form>
  )
}
