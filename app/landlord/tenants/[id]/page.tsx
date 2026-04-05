import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Phone, Mail, MapPin, DollarSign, FileText, Wrench, MessageSquare, Edit, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tenant } = await supabase
    .from('tenants').select('*, properties(name, address, city, state)')
    .eq('id', id).eq('owner_id', user!.id).single()

  if (!tenant) notFound()

  const [{ data: leases }, { data: payments }, { data: maintenance }] = await Promise.all([
    supabase.from('leases').select('*').eq('tenant_id', id).order('created_at', { ascending: false }),
    supabase.from('rent_payments').select('*').eq('tenant_id', id).order('due_date', { ascending: false }).limit(12),
    supabase.from('maintenance_requests').select('*').eq('tenant_id', id).order('created_at', { ascending: false }).limit(5),
  ])

  const statusColors: Record<string, string> = {
    active: 'bg-green-400/10 text-green-400',
    applicant: 'bg-yellow-400/10 text-yellow-400',
    past: 'bg-slate-700 text-slate-400',
    evicted: 'bg-red-400/10 text-red-400',
  }

  const totalPaid = payments?.filter(p => p.status === 'paid').reduce((s, p) => s + p.total_amount, 0) || 0
  const latePays = payments?.filter(p => p.status === 'late').length || 0
  const activeLeases = leases?.filter(l => l.status === 'active') || []

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/landlord/tenants" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="page-title mb-0">{tenant.first_name} {tenant.last_name}</h1>
              <span className={`badge text-xs capitalize ${statusColors[tenant.status] || statusColors.past}`}>{tenant.status}</span>
            </div>
            <p className="text-slate-500 text-sm">{tenant.properties?.name || 'No property assigned'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/landlord/messages?tenant=${id}`} className="btn-secondary">
            <MessageSquare className="w-4 h-4" /> Message
          </Link>
          <Link href={`/landlord/tenants/${id}/edit`} className="btn-secondary">
            <Edit className="w-4 h-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Total Paid', value: formatCurrency(totalPaid), color:'text-green-400' },
          { label:'Late Payments', value: latePays, color: latePays > 0 ? 'text-red-400' : 'text-slate-400' },
          { label:'Active Leases', value: activeLeases.length, color:'text-landlord' },
          { label:'Monthly Income', value: tenant.monthly_income ? formatCurrency(tenant.monthly_income) : '—', color:'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-slate-500 text-xs">{s.label}</span>
            <p className={`font-display text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CONTACT */}
        <div className="card p-6">
          <h2 className="section-title">Contact Information</h2>
          <div className="space-y-3">
            {tenant.email && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <a href={`mailto:${tenant.email}`} className="text-sm text-landlord hover:underline">{tenant.email}</a>
                </div>
              </div>
            )}
            {tenant.phone && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Phone</p>
                  <a href={`tel:${tenant.phone}`} className="text-sm text-slate-200">{tenant.phone}</a>
                </div>
              </div>
            )}
            {tenant.properties && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl">
                <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Property</p>
                  <p className="text-sm text-slate-200">{tenant.properties.name}</p>
                  <p className="text-xs text-slate-500">{tenant.properties.address}, {tenant.properties.city}, {tenant.properties.state}</p>
                </div>
              </div>
            )}
            {tenant.move_in_date && (
              <div className="p-3 bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500">Move-in Date</p>
                <p className="text-sm text-slate-200">{formatDate(tenant.move_in_date)}</p>
              </div>
            )}
            {tenant.emergency_contact_name && (
              <div className="p-3 bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500">Emergency Contact</p>
                <p className="text-sm text-slate-200">{tenant.emergency_contact_name}</p>
                <p className="text-xs text-slate-500">{tenant.emergency_contact_phone}</p>
              </div>
            )}
            {tenant.notes && (
              <div className="p-3 bg-slate-800/30 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm text-slate-300">{tenant.notes}</p>
              </div>
            )}
            {tenant.portal_token && (
              <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20">
                <p className="text-xs text-slate-500 mb-1">Tenant Portal</p>
                <a
                  href={`/tenant/${tenant.portal_token}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-brand-400 hover:underline flex items-center gap-1"
                >
                  View portal <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* PAYMENT HISTORY */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="section-title">Payment History</h2>
          {!payments?.length ? (
            <p className="text-slate-500 text-sm text-center py-6">No payments recorded</p>
          ) : (
            <div className="space-y-1">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${p.status === 'paid' ? 'bg-green-400' : p.status === 'late' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-300">Due {formatDate(p.due_date)}</p>
                    {p.paid_date && <p className="text-xs text-slate-500">Paid {formatDate(p.paid_date)}</p>}
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

        {/* LEASES */}
        <div className="card p-6">
          <h2 className="section-title">Leases</h2>
          {!leases?.length ? (
            <p className="text-slate-500 text-sm text-center py-4">No leases</p>
          ) : (
            <div className="space-y-2">
              {leases.map((l: any) => (
                <Link key={l.id} href={`/landlord/leases/${l.id}`} className="block p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-200">{formatCurrency(l.monthly_rent)}/mo</p>
                    <span className={`badge text-xs ${l.status === 'active' ? 'bg-green-400/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{l.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{formatDate(l.start_date)} → {formatDate(l.end_date)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* MAINTENANCE */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="section-title">Maintenance History</h2>
          {!maintenance?.length ? (
            <p className="text-slate-500 text-sm text-center py-4">No maintenance requests</p>
          ) : (
            <div className="space-y-2">
              {maintenance.map((m: any) => (
                <Link key={m.id} href={`/landlord/maintenance/${m.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.priority === 'emergency' ? 'bg-red-400' : m.priority === 'high' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{m.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.priority} · {m.category} · {formatDate(m.created_at)}</p>
                  </div>
                  <span className={`badge text-xs capitalize ${m.status === 'completed' ? 'bg-green-400/10 text-green-400' : 'bg-orange-400/10 text-orange-400'}`}>{m.status.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
