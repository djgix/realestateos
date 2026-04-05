import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { MessageComposer } from '../MessageComposer'

export default async function NewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const sp = await searchParams

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, property_id, first_name, last_name, properties(name)')
    .eq('owner_id', user!.id)
    .order('first_name', { ascending: true })

  const tenantOptions = (tenants ?? []).map((tenant: any) => ({
    id: tenant.id,
    property_id: tenant.property_id,
    first_name: tenant.first_name,
    last_name: tenant.last_name,
    properties: Array.isArray(tenant.properties) ? tenant.properties[0] ?? null : tenant.properties,
  }))

  return (
    <div className="max-w-3xl">
      <Link href="/landlord/messages" className="text-sm text-slate-500 hover:text-white flex items-center gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to messages
      </Link>
      <div className="page-header">
        <h1 className="page-title">New message</h1>
        <p className="page-subtitle">Send a direct message to one tenant.</p>
      </div>
      <MessageComposer ownerId={user!.id} tenants={tenantOptions} defaultTemplate={sp.template || ''} />
    </div>
  )
}
