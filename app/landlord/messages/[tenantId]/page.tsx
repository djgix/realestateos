import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { ThreadReplyBox } from '../ThreadReplyBox'

export default async function MessageThreadPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: tenant }, { data: messages }] = await Promise.all([
    supabase
      .from('tenants')
      .select('id, property_id, first_name, last_name, properties(name)')
      .eq('id', tenantId)
      .eq('owner_id', user!.id)
      .single(),
    supabase
      .from('messages')
      .select('*')
      .eq('owner_id', user!.id)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: true }),
  ])

  if (!tenant) notFound()

  const property = Array.isArray(tenant.properties) ? tenant.properties[0] ?? null : tenant.properties

  return (
    <div className="max-w-4xl">
      <Link href="/landlord/messages" className="text-sm text-slate-500 hover:text-white flex items-center gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to messages
      </Link>
      <div className="page-header">
        <h1 className="page-title">{tenant.first_name} {tenant.last_name}</h1>
        <p className="page-subtitle">{property?.name || 'No property assigned'}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="card p-6 space-y-3">
          <h2 className="section-title">Conversation</h2>
          {!messages?.length ? (
            <p className="text-slate-500 text-sm">No messages yet.</p>
          ) : (
            <div className="space-y-3">
              {messages.map((message: any) => (
                <div key={message.id} className={`rounded-xl p-4 border ${message.sender === 'owner' ? 'bg-brand-500/5 border-brand-500/20' : 'bg-slate-900 border-slate-800'}`}>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-slate-200 capitalize">{message.sender}</p>
                    <p className="text-[11px] text-slate-500">{formatDate(message.created_at)}</p>
                  </div>
                  {message.subject && <p className="text-sm text-slate-300 mb-2">{message.subject}</p>}
                  <p className="text-sm text-slate-400 whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <ThreadReplyBox ownerId={user!.id} tenantId={tenant.id} propertyId={tenant.property_id} />
      </div>
    </div>
  )
}
