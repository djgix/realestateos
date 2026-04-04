import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Building2, MapPin, Users, FileText, Wrench, DollarSign, Edit, Plus } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!property) notFound()

  const [
    { data: tenants },
    { data: leases },
    { data: maintenance },
    { data: payments },
    { data: expenses },
  ] = await Promise.all([
    supabase.from('tenants').select('*').eq('property_id', id).eq('status', 'active'),
    supabase.from('leases').select('*, tenants(first_name, last_name)').eq('property_id', id).eq('status', 'active'),
    supabase.from('maintenance_requests').select('*').eq('property_id', id).neq('status', 'completed').limit(5),
    supabase.from('rent_payments').select('*').eq('property_id', id).order('due_date', { ascending: false }).limit(6),
    supabase.from('expenses').select('*').eq('property_id', id).order('date', { ascending: false }).limit(5),
  ])

  const monthlyRent = leases?.reduce((s, l) => s + l.monthly_rent, 0) || 0
  const equity = property.current_value && property.mortgage_balance
    ? property.current_value - property.mortgage_balance : null

  return (
    <div>
      <div className="page-header flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/landlord/properties" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="page-title mb-0">{property.name}</h1>
            <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {property.address}, {property.city}, {property.state} {property.zip}
            </div>
          </div>
        </div>
        <Link href={`/landlord/properties/${id}/edit`} className="btn-secondary">
          <Edit className="w-4 h-4" /> Edit
        </Link>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Monthly Rent', value: formatCurrency(monthlyRent), color:'text-landlord' },
          { label:'Active Tenants', value: tenants?.length || 0, color:'text-green-400' },
          { label:'Current Value', value: property.current_value ? formatCurrency(property.current_value) : '—', color:'text-blue-400' },
          { label:'Equity', value: equity ? formatCurrency(equity) : '—', color:'text-brand-400' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <span className="text-slate-500 text-xs">{s.label}</span>
            <p className={`font-display text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TENANTS */}
        <div className="card p-6 border-brand-500/20 bg-slate-900 shadow-[0_0_20px_rgba(79,110,247,0.05)] relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h2 className="section-title mb-0 flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-400" /> 
              {tenants?.length ? 'Active Tenants' : 'Applicant Tracking (ATS)'}
            </h2>
            <Link href={`/landlord/tenants/new?property=${id}`} className="btn-ghost text-xs">
              <Plus className="w-3.5 h-3.5" /> Add Manual
            </Link>
          </div>
          {!tenants?.length ? (
            <div className="relative z-10 space-y-4">
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-brand-400 font-medium text-sm">Property is Vacant</p>
                  <p className="text-slate-400 text-xs mt-1">Syndicating to Zillow & Apartments.com</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-green-400 uppercase tracking-widest bg-green-500/10 px-2 py-1 rounded">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> Active Listing
                  </span>
                </div>
              </div>

              {/* MOCK ATS APPLICANT */}
              <div className="card p-4 border-slate-700 bg-slate-950">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold font-mono border border-blue-500/30">SJ</div>
                    <div>
                      <p className="text-sm font-medium text-slate-200">Sarah Jenkins</p>
                      <p className="text-xs text-slate-500">Applied 2 hours ago</p>
                    </div>
                  </div>
                  <span className="badge bg-green-500/10 text-green-400 border border-green-500/20">Pre-Qualified</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-900 rounded p-2 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">TransUnion Score</p>
                    <p className="text-lg font-display text-green-400">742</p>
                  </div>
                  <div className="bg-slate-900 rounded p-2 text-center">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Income (Verified)</p>
                    <p className="text-lg font-display text-slate-200">$8.2k<span className="text-xs text-slate-500">/mo</span></p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-secondary text-xs w-full justify-center py-2">View Full Report</button>
                  <Link href={`/landlord/resolutions/lease?tenant_id=mock_applicant&property_id=${id}`} className="btn bg-brand-500 hover:bg-brand-400 text-white text-xs w-full justify-center py-2 shadow-lg shadow-brand-500/20">
                    Generate Lease 
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 relative z-10">
              {tenants.map((t: any) => (
                <Link key={t.id} href={`/landlord/tenants/${t.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div className="w-8 h-8 bg-landlord/15 rounded-lg flex items-center justify-center">
                    <span className="text-landlord text-xs font-bold">{t.first_name[0]}{t.last_name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{t.first_name} {t.last_name}</p>
                    <p className="text-xs text-slate-500">{t.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ACTIVE LEASES */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Active Leases</h2>
            <Link href={`/landlord/leases/new?property=${id}`} className="btn-ghost text-xs">
              <Plus className="w-3.5 h-3.5" /> New
            </Link>
          </div>
          {!leases?.length ? (
            <p className="text-slate-500 text-sm text-center py-6">No active leases</p>
          ) : (
            <div className="space-y-2">
              {leases.map((l: any) => (
                <Link key={l.id} href={`/landlord/leases/${l.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{l.tenants?.first_name} {l.tenants?.last_name}</p>
                    <p className="text-xs text-slate-500">Ends {formatDate(l.end_date)}</p>
                  </div>
                  <p className="font-semibold text-slate-200">{formatCurrency(l.monthly_rent)}/mo</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* MAINTENANCE */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Open Maintenance</h2>
            <Link href={`/landlord/maintenance/new?property=${id}`} className="btn-ghost text-xs">
              <Plus className="w-3.5 h-3.5" /> New
            </Link>
          </div>
          {!maintenance?.length ? (
            <p className="text-slate-500 text-sm text-center py-6">No open requests</p>
          ) : (
            <div className="space-y-2">
              {maintenance.map((m: any) => (
                <Link key={m.id} href={`/landlord/maintenance/${m.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.priority === 'emergency' ? 'bg-red-400' : m.priority === 'high' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-200">{m.title}</p>
                    <p className="text-xs text-slate-500 capitalize">{m.priority} · {m.category}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* RECENT PAYMENTS */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title mb-0">Recent Payments</h2>
          </div>
          {!payments?.length ? (
            <p className="text-slate-500 text-sm text-center py-6">No payments recorded</p>
          ) : (
            <div className="space-y-2">
              {payments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30">
                  <div>
                    <p className="text-xs text-slate-500">{formatDate(p.due_date)}</p>
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

      {/* PROPERTY DETAILS */}
      <div className="card p-6 mt-6">
        <h2 className="section-title">Property Details</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Type', value: property.type?.replace('_', ' ') },
            { label:'Units', value: property.units },
            { label:'Bedrooms', value: property.bedrooms || '—' },
            { label:'Bathrooms', value: property.bathrooms || '—' },
            { label:'Square Feet', value: property.square_feet ? `${property.square_feet.toLocaleString()} sqft` : '—' },
            { label:'Year Built', value: property.year_built || '—' },
            { label:'Purchase Price', value: property.purchase_price ? formatCurrency(property.purchase_price) : '—' },
            { label:'Monthly Mortgage', value: property.monthly_mortgage ? formatCurrency(property.monthly_mortgage) : '—' },
          ].map(item => (
            <div key={item.label} className="p-3 bg-slate-800/30 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">{item.label}</p>
              <p className="text-sm font-medium text-slate-200 capitalize">{item.value}</p>
            </div>
          ))}
        </div>
        {property.notes && (
          <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
            <p className="text-xs text-slate-500 mb-1">Notes</p>
            <p className="text-sm text-slate-300">{property.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
