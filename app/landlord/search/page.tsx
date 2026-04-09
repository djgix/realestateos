import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Search, Building2, Users, Wrench, FileText } from 'lucide-react'
import Link from 'next/link'

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams
  const query = q?.trim() || ''
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!query) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Search</h1>
          <p className="page-subtitle">Search across your properties, tenants, and maintenance requests</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">Type something to search</p>
          <p className="text-slate-600 text-sm mt-1">Try a tenant name, property address, or maintenance issue</p>
        </div>
      </div>
    )
  }

  const like = `%${query}%`

  const [
    { data: properties },
    { data: tenants },
    { data: maintenance },
    { data: leases },
  ] = await Promise.all([
    supabase.from('properties').select('id, name, address, city, state, type').eq('owner_id', user!.id)
      .or(`name.ilike.${like},address.ilike.${like},city.ilike.${like}`).limit(10),
    supabase.from('tenants').select('id, first_name, last_name, email, phone, status').eq('owner_id', user!.id)
      .or(`first_name.ilike.${like},last_name.ilike.${like},email.ilike.${like}`).limit(10),
    supabase.from('maintenance_requests').select('id, title, category, priority, status, created_at, properties(name)').eq('owner_id', user!.id)
      .ilike('title', like).limit(10),
    supabase.from('leases').select('id, status, monthly_rent, start_date, end_date, tenants(first_name, last_name), properties(name)').eq('owner_id', user!.id)
      .limit(5),
  ])

  const total = (properties?.length || 0) + (tenants?.length || 0) + (maintenance?.length || 0)

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Search results for &ldquo;{query}&rdquo;</h1>
        <p className="page-subtitle">{total} result{total !== 1 ? 's' : ''} found</p>
      </div>

      {total === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="w-12 h-12 text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">No results found</p>
          <p className="text-slate-600 text-sm mt-1">Try a different search term</p>
        </div>
      )}

      <div className="space-y-8">
        {/* PROPERTIES */}
        {(properties?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-slate-500" />
              <h2 className="section-title mb-0">Properties</h2>
              <span className="text-xs text-slate-600">({properties!.length})</span>
            </div>
            <div className="space-y-2">
              {properties!.map((p: any) => (
                <Link key={p.id} href={`/landlord/properties/${p.id}`}
                  className="flex items-center gap-4 p-4 card hover:border-slate-700 transition-colors">
                  <div className="w-10 h-10 bg-landlord/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-landlord" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-200">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.address}, {p.city}, {p.state}</p>
                  </div>
                  <span className="text-xs text-slate-600 capitalize">{p.type?.replace('_', ' ')}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* TENANTS */}
        {(tenants?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-slate-500" />
              <h2 className="section-title mb-0">Tenants</h2>
              <span className="text-xs text-slate-600">({tenants!.length})</span>
            </div>
            <div className="space-y-2">
              {tenants!.map((t: any) => (
                <Link key={t.id} href={`/landlord/tenants/${t.id}`}
                  className="flex items-center gap-4 p-4 card hover:border-slate-700 transition-colors">
                  <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-brand-400 font-bold text-sm">
                      {t.first_name?.[0]}{t.last_name?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-200">{t.first_name} {t.last_name}</p>
                    <p className="text-sm text-slate-500">{t.email}</p>
                  </div>
                  <span className={`badge text-xs capitalize ${
                    t.status === 'active' ? 'bg-green-400/10 text-green-400' :
                    t.status === 'applicant' ? 'bg-yellow-400/10 text-yellow-400' :
                    'bg-slate-700 text-slate-400'
                  }`}>{t.status}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* MAINTENANCE */}
        {(maintenance?.length ?? 0) > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="w-4 h-4 text-slate-500" />
              <h2 className="section-title mb-0">Maintenance</h2>
              <span className="text-xs text-slate-600">({maintenance!.length})</span>
            </div>
            <div className="space-y-2">
              {maintenance!.map((m: any) => (
                <Link key={m.id} href={`/landlord/maintenance/${m.id}`}
                  className="flex items-center gap-4 p-4 card hover:border-slate-700 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    m.priority === 'emergency' ? 'bg-red-400' :
                    m.priority === 'high' ? 'bg-orange-400' : 'bg-blue-400'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-200">{m.title}</p>
                    <p className="text-sm text-slate-500">{(m.properties as any)?.name} · {m.category} · {formatDate(m.created_at)}</p>
                  </div>
                  <span className={`badge text-xs capitalize ${m.status === 'completed' ? 'bg-green-400/10 text-green-400' : 'bg-orange-400/10 text-orange-400'}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
