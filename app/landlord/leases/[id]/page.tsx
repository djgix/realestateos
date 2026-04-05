import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, getDaysUntil } from '@/lib/utils'
import { ArrowLeft, FileText, DollarSign, Calendar, User, Building2, CheckCircle, AlertTriangle, Download } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import LeaseActions from './LeaseActions'

export default async function LeaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: lease } = await supabase
    .from('leases')
    .select('*, tenants(first_name, last_name, email, phone, portal_token), properties(name, address, city, state)')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!lease) notFound()

  const { data: payments } = await supabase
    .from('rent_payments')
    .select('*')
    .eq('tenant_id', lease.tenant_id)
    .order('due_date', { ascending: false })
    .limit(12)

  const daysLeft = getDaysUntil(lease.end_date)
  const totalPaid = payments?.filter(p => p.status === 'paid').reduce((s, p) => s + p.total_amount, 0) || 0
  const latePays = payments?.filter(p => p.status === 'late').length || 0

  const statusColor: Record<string, string> = {
    active: 'bg-green-400/10 text-green-400 border-green-400/20',
    draft: 'bg-slate-700 text-slate-400 border-slate-600',
    expired: 'bg-red-400/10 text-red-400 border-red-400/20',
    terminated: 'bg-red-400/10 text-red-400 border-red-400/20',
    sent: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  }

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/landlord/leases" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title mb-0">
                {lease.tenants?.first_name} {lease.tenants?.last_name}
              </h1>
              <span className={`badge text-xs capitalize border ${statusColor[lease.status] || statusColor.draft}`}>
                {lease.status}
              </span>
              {lease.status === 'active' && daysLeft <= 60 && daysLeft > 0 && (
                <span className="badge bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs">
                  Expires in {daysLeft}d
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm">{lease.properties?.name} · {lease.state}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary opacity-50 cursor-not-allowed" title="PDF generation coming soon">
            <Download className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Monthly Rent', value: formatCurrency(lease.monthly_rent), color: 'text-landlord' },
          { label: 'Total Collected', value: formatCurrency(totalPaid), color: 'text-green-400' },
          { label: 'Late Payments', value: latePays, color: latePays > 0 ? 'text-red-400' : 'text-slate-400' },
          { label: 'Security Deposit', value: formatCurrency(lease.security_deposit), color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-slate-500 text-xs">{s.label}</span>
            <p className={`font-display text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEASE DETAILS */}
        <div className="card p-6">
          <h2 className="section-title">Lease Details</h2>
          <div className="space-y-3">
            {[
              { icon: <Calendar className="w-4 h-4 text-slate-500" />, label: 'Start Date', value: formatDate(lease.start_date) },
              { icon: <Calendar className="w-4 h-4 text-slate-500" />, label: 'End Date', value: formatDate(lease.end_date) },
              { icon: <FileText className="w-4 h-4 text-slate-500" />, label: 'Type', value: lease.lease_type.replace('_', '-to-') },
              { icon: <DollarSign className="w-4 h-4 text-slate-500" />, label: 'Late Fee', value: `${formatCurrency(lease.late_fee)} after ${lease.late_fee_days} days` },
              { icon: <DollarSign className="w-4 h-4 text-slate-500" />, label: 'Rent Due', value: `${lease.rent_due_day}${lease.rent_due_day === 1 ? 'st' : lease.rent_due_day === 2 ? 'nd' : lease.rent_due_day === 3 ? 'rd' : 'th'} of month` },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                {item.icon}
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-sm text-slate-200 capitalize">{item.value}</p>
                </div>
              </div>
            ))}

            {lease.notes && (
              <div className="p-3 bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-300">{lease.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* TENANT + ACTIONS */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title">Tenant</h2>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-landlord/15 rounded-xl flex items-center justify-center">
                <span className="text-landlord font-bold text-sm">
                  {lease.tenants?.first_name?.[0]}{lease.tenants?.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-slate-200">{lease.tenants?.first_name} {lease.tenants?.last_name}</p>
                <p className="text-xs text-slate-500">{lease.tenants?.email}</p>
              </div>
            </div>
            <Link href={`/landlord/tenants/${lease.tenant_id}`} className="btn-secondary w-full justify-center text-sm">
              <User className="w-4 h-4" /> View Tenant Profile
            </Link>
            {lease.tenants?.portal_token && (
              <div className="mt-3 p-3 bg-slate-800/50 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Tenant Portal</p>
                <code className="text-xs text-brand-400 break-all">
                  {process.env.NEXT_PUBLIC_APP_URL || 'https://realestateos.com'}/tenant/{lease.tenants.portal_token}
                </code>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="section-title">Property</h2>
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-slate-200">{lease.properties?.name}</p>
                <p className="text-xs text-slate-500">{lease.properties?.address}, {lease.properties?.city}, {lease.properties?.state}</p>
              </div>
            </div>
          </div>

          {/* LEASE ACTIONS */}
          <LeaseActions lease={lease} />
        </div>

        {/* PAYMENT HISTORY */}
        <div className="card p-6">
          <h2 className="section-title">Payment History</h2>
          {!payments?.length ? (
            <p className="text-slate-500 text-sm text-center py-6">No payments recorded</p>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-800/40">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'paid' ? 'bg-green-400' : p.status === 'late' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <div className="flex-1">
                    <p className="text-xs text-slate-400">{formatDate(p.due_date)}</p>
                    {p.paid_date && <p className="text-xs text-slate-600">Paid {formatDate(p.paid_date)}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">{formatCurrency(p.total_amount)}</p>
                    <p className={`text-xs capitalize ${p.status === 'paid' ? 'text-green-400' : p.status === 'late' ? 'text-red-400' : 'text-yellow-400'}`}>{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
