import { createClient } from '@/lib/supabase/server'
import { MaintenanceClient } from './MaintenanceClient'
import { notFound } from 'next/navigation'

export default async function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: req } = await supabase
    .from('maintenance_requests')
    .select('*, properties(*), tenants(*)')
    .eq('id', id)
    .eq('owner_id', user!.id)
    .single()

  if (!req) notFound()

  // Pre-fetch preferred contractor for this category
  const { data: preferredContractor } = await supabase
    .from('contractor_directory')
    .select('*')
    .eq('owner_id', user!.id)
    .eq('category', req.category)
    .eq('preferred', true)
    .limit(1)
    .single()

  return (
    <MaintenanceClient
      req={req}
      tenant={req.tenants}
      property={req.properties}
      preferredContractor={preferredContractor || null}
    />
  )
}
