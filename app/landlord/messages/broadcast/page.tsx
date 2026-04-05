'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send, Loader2, Users, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function BroadcastPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<any[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('tenants').select('id, first_name, last_name, email, properties(name)').eq('status', 'active').order('first_name')
      setTenants(data || [])
    }
    load()
  }, [])

  async function handleBroadcast(e: React.FormEvent) {
    e.preventDefault()
    if (!body || !tenants.length) return
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const records = tenants.map(t => ({
      owner_id: user!.id,
      tenant_id: t.id,
      subject: subject || null,
      body,
      sender: 'landlord',
      read: false,
    }))
    const { error } = await supabase.from('messages').insert(records)
    if (error) { toast.error('Broadcast failed'); setSending(false); return }
    setSent(true)
    setSending(false)
  }

  if (sent) return (
    <div className="flex flex-col items-center justify-center py-24">
      <CheckCircle className="w-14 h-14 text-green-400 mb-4" />
      <h2 className="font-display text-2xl text-slate-100 mb-2">Broadcast Sent!</h2>
      <p className="text-slate-400 mb-6">Message delivered to {tenants.length} tenant{tenants.length !== 1 ? 's' : ''}.</p>
      <Link href="/landlord/messages" className="btn-landlord">Back to Messages</Link>
    </div>
  )

  return (
    <div>
      <div className="page-header flex items-center gap-4">
        <Link href="/landlord/messages" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Broadcast Message</h1>
          <p className="page-subtitle">Send one message to all {tenants.length} active tenants at once</p>
        </div>
      </div>

      <form onSubmit={handleBroadcast} className="max-w-2xl space-y-4">
        <div className="card p-4 flex items-center gap-3">
          <Users className="w-5 h-5 text-landlord" />
          <p className="text-slate-300 text-sm">Sending to <strong>{tenants.length}</strong> active tenant{tenants.length !== 1 ? 's' : ''}</p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="form-group">
            <label className="label">Subject (optional)</label>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="input" placeholder="e.g. Building maintenance notice" />
          </div>
          <div className="form-group">
            <label className="label">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} className="input resize-none" rows={8} required placeholder="Write your message to all tenants..." />
          </div>
        </div>

        <button type="submit" disabled={sending || !tenants.length} className="btn-landlord">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send to {tenants.length} Tenant{tenants.length !== 1 ? 's' : ''}
        </button>
      </form>
    </div>
  )
}
