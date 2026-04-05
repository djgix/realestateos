'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessageReply({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('messages').insert({
      owner_id: user!.id,
      tenant_id: tenantId,
      body: body.trim(),
      sender: 'landlord',
      read: false,
    })
    if (error) { toast.error('Failed to send'); setSending(false); return }
    setBody('')
    setSending(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSend} className="flex gap-3 pt-4 border-t border-slate-800">
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e) } }}
        className="input flex-1 resize-none py-3"
        rows={2}
        placeholder="Type a reply... (Enter to send, Shift+Enter for new line)"
      />
      <button type="submit" disabled={sending || !body.trim()} className="btn-landlord self-end">
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  )
}
