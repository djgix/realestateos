import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BroadcastComposer } from './BroadcastComposer'

export default async function BroadcastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, property_id, first_name, last_name, status, properties(name)')
    .eq('owner_id', user!.id)
    .order('first_name', { ascending: true })

  const tenantOptions = (tenants ?? []).map((tenant: any) => ({
    id: tenant.id,
    property_id: tenant.property_id,
    first_name: tenant.first_name,
    last_name: tenant.last_name,
    status: tenant.status,
    properties: Array.isArray(tenant.properties) ? tenant.properties[0] ?? null : tenant.properties,
  }))

  return (
    <div className="max-w-4xl">
      <Link href="/landlord/messages" className="text-sm text-slate-500 hover:text-white flex items-center gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to messages
      </Link>
      <div className="page-header">
        <h1 className="page-title">Broadcast</h1>
        <p className="page-subtitle">Send one message to multiple tenants at once.</p>
      </div>
      <BroadcastComposer ownerId={user!.id} tenants={tenantOptions} />
    </div>
  )
}
