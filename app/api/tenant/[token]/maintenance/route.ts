import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { notifyLandlordMaintenance } from '@/lib/twilio'
import { sendMaintenanceAlert } from '@/lib/emails'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await req.json()
  const { title, description, category, priority } = body

  if (!title || !description || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = getServiceClient() as any

  // Look up tenant by portal token
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*, properties(name, address, city, state), profiles!owner_id(full_name, phone, email)')
    .eq('portal_token', token)
    .single()

  if (!tenant) {
    return NextResponse.json({ error: 'Invalid portal link' }, { status: 404 })
  }

  // Insert maintenance request
  const { data: request, error } = await supabase
    .from('maintenance_requests')
    .insert({
      owner_id: tenant.owner_id,
      property_id: tenant.property_id,
      tenant_id: tenant.id,
      title,
      description,
      category,
      priority: priority || 'normal',
      status: 'open',
      submitted_via: 'tenant',
      landlord_approval_status: 'pending_sms',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  // Update landlord_notified_at
  await supabase
    .from('maintenance_requests')
    .update({ landlord_notified_at: new Date().toISOString() })
    .eq('id', request.id)

  // SMS landlord if they have a phone number
  const landlordProfile = Array.isArray(tenant.profiles) ? tenant.profiles[0] : tenant.profiles
  const address = tenant.properties
    ? `${tenant.properties.address}, ${tenant.properties.city}, ${tenant.properties.state}`
    : 'Unknown address'

  const tenantName = `${tenant.first_name} ${tenant.last_name}`
  const normalizedPriority = priority || 'normal'

  // SMS notification
  if (landlordProfile?.phone) {
    await notifyLandlordMaintenance({
      landlordPhone: landlordProfile.phone,
      tenantName,
      address,
      title,
      description,
      category,
      priority: normalizedPriority,
    })
  }

  // Email notification
  if (landlordProfile?.email) {
    await sendMaintenanceAlert({
      landlordEmail: landlordProfile.email,
      tenantName,
      address,
      title,
      description,
      category,
      priority: normalizedPriority,
      requestId: request.id,
    })
  }

  return NextResponse.json({ success: true, id: request.id })
}
