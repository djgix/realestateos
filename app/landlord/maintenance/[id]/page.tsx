import { createClient } from '@/lib/supabase/server'
import { MaintenanceClient } from './MaintenanceClient'
import { notFound } from 'next/navigation'

export default async function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('maintenance_requests')
    .select('*, properties(*), tenants(*)')
    .eq('id', resolvedParams.id)
    .single()

  if (!req) notFound()

  const { data: events } = await supabase
    .from('automation_events')
    .select('*')
    .eq('owner_id', req.owner_id)
    .contains('metadata', { maintenance_id: req.id })
    .order('created_at', { ascending: false })
    .limit(8)

  return <MaintenanceClient req={req} tenant={req.tenants} property={req.properties} events={events ?? []} />
}
