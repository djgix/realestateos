'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

function NewMessageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const preTenant = searchParams.get('tenant') || ''
  const preTemplate = searchParams.get('template') || ''

  const [tenants, setTenants] = useState<any[]>([])
  const [form, setForm] = useState({ tenant_id: preTenant, subject: preTemplate, body: '' })
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from('tenants')
        .select('id, first_name, last_name, email, properties(name)')
        .eq('status', 'active')
        .order('first_name')
      setTenants(data || [])
    }
    load()
  }, [])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!form.tenant_id || !form.body) { toast.error('Select a tenant and write a message'); return }
    setSending(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('messages').insert({
      owner_id: user!.id,
      tenant_id: form.tenant_id,
      subject: form.subject || null,
      body: form.body,
      sender: 'landlord',
      read: false,
    })
    if (error) { toast.error('Failed to send message'); setSending(false); return }
    toast.success('Message sent')
    router.push(`/landlord/messages/${form.tenant_id}`)
  }

  return (
    <div>
      <div className="page-header flex items-center gap-4">
        <Link href="/landlord/messages" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="page-title mb-0">New Message</h1>
      </div>
      <form onSubmit={handleSend} className="max-w-2xl space-y-4">
        <div className="card p-6 space-y-4">
          <div className="form-group">
            <label className="label">To</label>
            <select value={form.tenant_id} onChange={e => setForm(f => ({ ...f, tenant_id: e.target.value }))} className="select" required>
              <option value="">Select tenant...</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name} — {(t.properties as any)?.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Subject (optional)</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} className="input" placeholder="e.g. Rent reminder" />
          </div>
          <div className="form-group">
            <label className="label">Message</label>
            <textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} className="input resize-none" rows={8} required placeholder="Write your message..." />
          </div>
        </div>
        <button type="submit" disabled={sending} className="btn-landlord">
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Message
        </button>
      </form>
    </div>
  )
}

export default function NewMessagePage() {
  return <Suspense fallback={<div />}><NewMessageContent /></Suspense>
}
