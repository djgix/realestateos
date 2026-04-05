import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { notifyContractor } from '@/lib/twilio'
import { sendContractorDispatch, sendMaintenanceUpdate } from '@/lib/emails'
import { CONTRACTOR_TYPE } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { contractor_name, contractor_phone, contractor_email } = body

  const service = getServiceClient()

  // Fetch request to verify ownership
  const { data: request } = await (service
    .from('maintenance_requests') as any)
    .select('*, tenants(first_name, last_name, email), properties(address, city, state)')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single() as { data: Record<string, any> | null }

  if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Update request
  await (service
    .from('maintenance_requests') as any)
    .update({
      status: 'in_progress',
      dispatched_at: new Date().toISOString(),
      landlord_approval_status: 'approved',
      contractor_name: contractor_name || (request as any).contractor_name,
      contractor_phone: contractor_phone || (request as any).contractor_phone,
      contractor_email: contractor_email || (request as any).contractor_email,
    })
    .eq('id', id)

  const address = request.properties
    ? `${request.properties.address}, ${request.properties.city}, ${request.properties.state}`
    : ''

  const finalPhone = contractor_phone || request.contractor_phone
  const finalEmail = contractor_email || request.contractor_email
  const finalName = contractor_name || request.contractor_name || 'Contractor'

  // Notify contractor
  if (finalPhone) {
    await notifyContractor({
      contractorPhone: finalPhone,
      contractorName: finalName,
      category: request.category,
      address,
      tenantName: `${request.tenants?.first_name} ${request.tenants?.last_name}`,
      title: request.title,
      description: request.description,
    })
  }

  if (finalEmail) {
    await sendContractorDispatch({
      contractorEmail: finalEmail,
      contractorName: finalName,
      category: CONTRACTOR_TYPE[request.category] || 'Handyman',
      address,
      tenantName: `${request.tenants?.first_name} ${request.tenants?.last_name}`,
      title: request.title,
      description: request.description,
    })
  }

  // Email tenant
  if (request.tenants?.email) {
    await sendMaintenanceUpdate({
      tenantEmail: request.tenants.email,
      tenantName: request.tenants.first_name,
      title: request.title,
      status: 'in_progress',
    })
  }

  return NextResponse.json({ success: true })
}
