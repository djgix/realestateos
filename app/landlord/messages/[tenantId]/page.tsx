import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import MessageReply from './MessageReply'

export default async function MessageThreadPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, first_name, last_name, email, properties(name)')
    .eq('id', tenantId)
    .eq('owner_id', user!.id)
    .single()

  if (!tenant) notFound()

  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: true })

  // Mark unread as read
  await supabase
    .from('messages')
    .update({ read: true })
    .eq('tenant_id', tenantId)
    .eq('owner_id', user!.id)
    .eq('sender', 'tenant')

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="page-header flex items-center gap-4 mb-4">
        <Link href="/landlord/messages" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">{tenant.first_name} {tenant.last_name}</h1>
          <p className="page-subtitle">{(tenant.properties as any)?.name} · {tenant.email}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {!messages?.length ? (
          <div className="text-center py-12 text-slate-500">No messages yet. Start the conversation.</div>
        ) : (
          messages.map(m => (
            <div key={m.id} className={`flex ${m.sender === 'landlord' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-lg rounded-2xl px-4 py-3 ${m.sender === 'landlord' ? 'bg-landlord text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                {m.subject && <p className="font-semibold text-sm mb-1">{m.subject}</p>}
                <p className="text-sm leading-relaxed">{m.body}</p>
                <p className={`text-xs mt-2 ${m.sender === 'landlord' ? 'text-landlord/60' : 'text-slate-500'}`}>
                  {formatDate(m.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <MessageReply tenantId={tenantId} />
    </div>
  )
}
