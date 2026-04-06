import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Bell, AlertTriangle, Wrench, MessageSquare, FileText, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

interface FeedItem {
  id: string
  type: 'late_payment' | 'maintenance' | 'message' | 'lease_expiring'
  icon: 'alert' | 'wrench' | 'message' | 'lease'
  color: string
  borderColor: string
  title: string
  subtitle: string
  time: string
  href: string
}

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysFromNow = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: latePayments },
    { data: maintenanceEvents },
    { data: tenantMessages },
    { data: expiringLeases },
  ] = await Promise.all([
    supabase
      .from('rent_payments')
      .select('*, tenants(first_name, last_name), properties(name)')
      .eq('owner_id', user!.id)
      .eq('status', 'late')
      .gte('due_date', thirtyDaysAgo)
      .order('due_date', { ascending: false })
      .limit(15),
    supabase
      .from('maintenance_requests')
      .select('*, tenants(first_name, last_name), properties(name)')
      .eq('owner_id', user!.id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('messages')
      .select('*, tenants(first_name, last_name)')
      .eq('owner_id', user!.id)
      .eq('sender', 'tenant')
      .order('created_at', { ascending: false })
      .limit(15),
    supabase
      .from('leases')
      .select('*, tenants(first_name, last_name), properties(name)')
      .eq('owner_id', user!.id)
      .eq('status', 'active')
      .lte('end_date', sixtyDaysFromNow)
      .order('end_date', { ascending: true })
      .limit(10),
  ])

  const feed: FeedItem[] = []

  for (const p of latePayments || []) {
    feed.push({
      id: `late-${(p as any).id}`,
      type: 'late_payment',
      icon: 'alert',
      color: 'text-red-400',
      borderColor: 'border-red-500/20',
      title: `Late payment — ${formatCurrency((p as any).total_amount)}`,
      subtitle: `${(p as any).tenants?.first_name} ${(p as any).tenants?.last_name} · ${(p as any).properties?.name}`,
      time: (p as any).due_date,
      href: '/landlord/finances/collections',
    })
  }

  for (const m of maintenanceEvents || []) {
    const isApproval = (m as any).landlord_approval_status === 'pending_sms'
    feed.push({
      id: `maint-${(m as any).id}`,
      type: 'maintenance',
      icon: 'wrench',
      color: isApproval ? 'text-amber-400' : 'text-blue-400',
      borderColor: isApproval ? 'border-amber-500/20' : 'border-blue-500/20',
      title: isApproval
        ? `Awaiting approval — ${(m as any).title}`
        : `Maintenance — ${(m as any).title}`,
      subtitle: `${(m as any).tenants?.first_name} ${(m as any).tenants?.last_name} · ${(m as any).properties?.name}`,
      time: (m as any).created_at,
      href: `/landlord/maintenance/${(m as any).id}`,
    })
  }

  for (const msg of tenantMessages || []) {
    feed.push({
      id: `msg-${(msg as any).id}`,
      type: 'message',
      icon: 'message',
      color: 'text-brand-400',
      borderColor: 'border-brand-500/20',
      title: `Message from ${(msg as any).tenants?.first_name} ${(msg as any).tenants?.last_name}`,
      subtitle: (msg as any).subject || (msg as any).body?.substring(0, 60) || 'No subject',
      time: (msg as any).created_at,
      href: `/landlord/messages/${(msg as any).tenant_id}`,
    })
  }

  for (const l of expiringLeases || []) {
    const daysLeft = Math.ceil((new Date((l as any).end_date).getTime() - Date.now()) / 86400000)
    feed.push({
      id: `lease-${(l as any).id}`,
      type: 'lease_expiring',
      icon: 'lease',
      color: 'text-yellow-400',
      borderColor: 'border-yellow-500/20',
      title: `Lease expiring in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
      subtitle: `${(l as any).tenants?.first_name} ${(l as any).tenants?.last_name} · ${(l as any).properties?.name}`,
      time: (l as any).end_date,
      href: `/landlord/leases/${(l as any).id}`,
    })
  }

  // Sort by time desc
  feed.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

  return (
    <div className="max-w-3xl">
      <div className="page-header flex items-center justify-between mb-8">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{feed.length} event{feed.length !== 1 ? 's' : ''} in the last 60 days</p>
        </div>
      </div>

      {!feed.length ? (
        <div className="card p-16 text-center">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-400/40" />
          <h3 className="font-display text-2xl text-slate-300 mb-2">All clear</h3>
          <p className="text-slate-500">No notifications in the past 60 days.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {feed.map(item => (
            <Link key={item.id} href={item.href} className={`card p-4 flex items-start gap-4 hover:bg-slate-800/50 transition-colors ${item.borderColor}`}>
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                {item.icon === 'alert' && <AlertTriangle className={`w-4 h-4 ${item.color}`} />}
                {item.icon === 'wrench' && <Wrench className={`w-4 h-4 ${item.color}`} />}
                {item.icon === 'message' && <MessageSquare className={`w-4 h-4 ${item.color}`} />}
                {item.icon === 'lease' && <FileText className={`w-4 h-4 ${item.color}`} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 mb-0.5">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
              </div>
              <p className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0">{formatDate(item.time)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
