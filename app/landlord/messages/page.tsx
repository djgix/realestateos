import { createClient } from '@/lib/supabase/server'
import { formatDate, getInitials } from '@/lib/utils'
import { MessageSquare, Plus, Send, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: messages } = await supabase
    .from('messages')
    .select('*, tenants(first_name, last_name, email), properties(name)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  // Group by tenant
  const threads = new Map<string, any>()
  messages?.forEach(msg => {
    if (!threads.has(msg.tenant_id)) {
      threads.set(msg.tenant_id, { tenant: msg.tenants, property: msg.properties, messages: [], unread: 0 })
    }
    const t = threads.get(msg.tenant_id)
    t.messages.push(msg)
    if (!msg.read && msg.sender === 'tenant') t.unread++
  })
  const threadList = Array.from(threads.values())
  const totalUnread = threadList.reduce((s, t) => s + t.unread, 0)

  const TEMPLATES = [
    'Rent reminder — payment due on the 1st',
    'Maintenance update — your request is scheduled',
    'Lease renewal — your lease expires soon',
    'Entry notice — we need access on [date]',
    'Late fee notice — payment is overdue',
    'Move-out instructions and checklist',
  ]

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-subtitle">{threadList.length} conversations{totalUnread > 0 ? ` · ${totalUnread} unread` : ''}</p>
        </div>
        <Link href="/landlord/messages/new" className="btn-landlord">
          <Plus className="w-4 h-4" /> New message
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!threadList.length ? (
            <div className="card p-16 text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-slate-600" />
              <h3 className="font-display text-2xl text-slate-300 mb-2">No messages yet</h3>
              <p className="text-slate-500 mb-6">Send your first message to a tenant.</p>
              <Link href="/landlord/messages/new" className="btn-landlord inline-flex">
                <Send className="w-4 h-4" /> Send message
              </Link>
            </div>
          ) : (
            <div className="card divide-y divide-slate-800/50 overflow-hidden">
              {threadList.map((thread, i) => {
                const last = thread.messages[0]
                return (
                  <Link key={i} href={`/landlord/messages/${thread.messages[0]?.tenant_id}`}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/30 transition-colors">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-landlord/15 rounded-xl flex items-center justify-center">
                        <span className="text-landlord text-sm font-semibold">
                          {getInitials(`${thread.tenant?.first_name} ${thread.tenant?.last_name}`)}
                        </span>
                      </div>
                      {thread.unread > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-landlord rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{thread.unread}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="font-medium text-slate-200 text-sm">{thread.tenant?.first_name} {thread.tenant?.last_name}</p>
                        <span className="text-xs text-slate-600">{formatDate(last.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {thread.property?.name && <span className="text-slate-600">{thread.property.name} · </span>}
                        {last.subject || last.body.slice(0, 60)}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h2 className="section-title">Quick Templates</h2>
            <div className="space-y-2">
              {TEMPLATES.map(t => (
                <Link key={t} href={`/landlord/messages/new?template=${encodeURIComponent(t)}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-800 hover:border-slate-700">
                  <MessageSquare className="w-4 h-4 text-landlord flex-shrink-0" />
                  <span className="text-sm text-slate-300 leading-tight">{t}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="card p-6">
            <h2 className="section-title">Broadcast</h2>
            <p className="text-slate-500 text-xs mb-4">Send one message to all your tenants at once.</p>
            <Link href="/landlord/messages/broadcast" className="btn-secondary w-full justify-center text-sm">
              <Send className="w-4 h-4" /> Send broadcast
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
