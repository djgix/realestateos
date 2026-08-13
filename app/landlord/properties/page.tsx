import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { Building2, Plus, MapPin, ArrowRight, Users } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Properties | REALESTATEos' }

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: properties } = await supabase
    .from('properties')
    .select('*, tenants(id, status)')
    .eq('owner_id', user!.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Properties</h1>
          <p className="page-subtitle">{properties?.length || 0} properties in your portfolio</p>
        </div>
        <Link href="/landlord/properties/new" className="btn-landlord">
          <Plus className="w-4 h-4" /> Add property
        </Link>
      </div>

      {!properties?.length ? (
        <div className="card p-16 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
          <h3 className="font-display text-2xl text-slate-300 mb-2">No properties yet</h3>
          <p className="text-slate-500 mb-6">Add your first rental property to get started.</p>
          <Link href="/landlord/properties/new" className="btn-landlord inline-flex">
            <Plus className="w-4 h-4" /> Add first property
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {properties.map((p: any) => {
            const active = p.tenants?.filter((t: any) => t.status === 'active').length || 0
            const occ = p.units > 0 ? Math.round((active / p.units) * 100) : 0
            return (
              <Link key={p.id} href={`/landlord/properties/${p.id}`} className="card overflow-hidden hover:border-slate-700 transition-all group">
                {p.photo_url && (
                  <div className="relative w-full h-36">
                    <Image src={p.photo_url} alt={p.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" />
                  </div>
                )}
                <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-landlord/10 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-landlord" />
                  </div>
                  <span className={`badge text-xs ${occ === 100 ? 'bg-green-400/10 text-green-400' : occ > 0 ? 'bg-yellow-400/10 text-yellow-400' : 'bg-slate-700 text-slate-400'}`}>
                    {occ}% occupied
                  </span>
                </div>
                <h3 className="font-semibold text-slate-200 text-lg mb-1">{p.name}</h3>
                <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                  <MapPin className="w-3.5 h-3.5" />
                  {p.address}, {p.city}, {p.state}
                </div>
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-800">
                  <div className="text-center">
                    <p className="font-display text-xl text-slate-200">{p.units}</p>
                    <p className="text-xs text-slate-500">Units</p>
                  </div>
                  <div className="text-center border-x border-slate-800">
                    <p className="font-display text-xl text-slate-200">{active}</p>
                    <p className="text-xs text-slate-500">Tenants</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl text-slate-200">
                      {p.current_value ? `$${(p.current_value/1000).toFixed(0)}k` : '—'}
                    </p>
                    <p className="text-xs text-slate-500">Value</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-4 text-landlord text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View details <ArrowRight className="w-3.5 h-3.5" />
                </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
