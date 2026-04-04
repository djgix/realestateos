import { createClient } from '@/lib/supabase/server'
import ResolutionWorkflow from './ResolutionClient'

export default async function ResolutionPage({ params, searchParams }: { params: Promise<{ type: string }>, searchParams: Promise<{ tenant_id?: string }> }) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()
  let tenantData = null
  let leaseData = null
  let landlordData = null

  if (resolvedSearchParams.tenant_id) {
    // Await supabase fetch
    const [
      { data: tenant },
      { data: lease }
    ] = await Promise.all([
      supabase.from('tenants').select('*, properties(*)').eq('id', resolvedSearchParams.tenant_id).single(),
      supabase.from('leases').select('*').eq('tenant_id', resolvedSearchParams.tenant_id).eq('status', 'active').single()
    ])

    if (tenant) {
      tenantData = tenant
      const { data: landlord } = await supabase.from('profiles').select('*').eq('id', tenant.owner_id).single()
      landlordData = landlord
    }
    if (lease) {
      leaseData = lease
    }
  }

  return <ResolutionWorkflow type={resolvedParams.type} tenant={tenantData} lease={leaseData} landlord={landlordData} />
}
