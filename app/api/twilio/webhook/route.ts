import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { replyToLandlord, notifyContractor, validateTwilioRequest } from '@/lib/twilio'
import { sendContractorDispatch, sendMaintenanceUpdate, sendMaintenanceDeclined } from '@/lib/emails'
import { CONTRACTOR_TYPE } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const params = Object.fromEntries(new URLSearchParams(body))

  // Validate Twilio signature
  const signature = req.headers.get('X-Twilio-Signature') || ''
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/webhook`
  if (!validateTwilioRequest(signature, url, params)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
  }

  const fromPhone = params.From?.replace(/\s/g, '')
  const messageBody = (params.Body || '').trim().toUpperCase()

  const supabase = getServiceClient() as any

  // Find landlord by phone number
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('phone', fromPhone)
    .single()

  if (!profile) {
    // Unknown sender — ignore silently
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  // Find their most recent pending_sms maintenance request
  const { data: request } = await supabase
    .from('maintenance_requests')
    .select('*, tenants(first_name, last_name, email), properties(address, city, state, name)')
    .eq('owner_id', profile.id)
    .eq('landlord_approval_status', 'pending_sms')
    .order('landlord_notified_at', { ascending: false })
    .limit(1)
    .single()

  if (!request) {
    await replyToLandlord(fromPhone, 'No pending maintenance requests found. Visit your dashboard to view requests.')
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    })
  }

  const address = request.properties
    ? `${request.properties.address}, ${request.properties.city}, ${request.properties.state}`
    : 'the property'

  if (messageBody === 'YES' || messageBody === 'Y') {
    // APPROVE — dispatch contractor
    const { error: updateError } = await supabase
      .from('maintenance_requests')
      .update({
        landlord_approval_status: 'approved',
        status: 'in_progress',
        dispatched_at: new Date().toISOString(),
      })
      .eq('id', request.id)

    if (updateError) {
      await replyToLandlord(fromPhone, 'Failed to update request. Please try again or visit your dashboard.')
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }

    // Look up preferred contractor for this category
    const { data: contractor } = await supabase
      .from('contractor_directory')
      .select('*')
      .eq('owner_id', profile.id)
      .eq('category', request.category)
      .eq('preferred', true)
      .limit(1)
      .single()

    let contractorNotified = false

    if (contractor) {
      // Update request with contractor info
      await supabase
        .from('maintenance_requests')
        .update({ contractor_name: contractor.name, contractor_email: contractor.email, contractor_phone: contractor.phone })
        .eq('id', request.id)

      // Notify via SMS if phone available
      if (contractor.phone) {
        await notifyContractor({
          contractorPhone: contractor.phone,
          contractorName: contractor.name,
          category: request.category,
          address,
          tenantName: `${request.tenants?.first_name} ${request.tenants?.last_name}`,
          title: request.title,
          description: request.description,
        })
        contractorNotified = true
      }

      // Notify via email if email available
      if (contractor.email) {
        await sendContractorDispatch({
          contractorEmail: contractor.email,
          contractorName: contractor.name,
          category: CONTRACTOR_TYPE[request.category] || 'Handyman',
          address,
          tenantName: `${request.tenants?.first_name} ${request.tenants?.last_name}`,
          title: request.title,
          description: request.description,
        })
        contractorNotified = true
      }
    }

    // Email tenant confirmation
    if (request.tenants?.email) {
      await sendMaintenanceUpdate({
        tenantEmail: request.tenants.email,
        tenantName: request.tenants.first_name,
        title: request.title,
        status: 'in_progress',
      })
    }

    const contractorNote = contractorNotified
      ? `${contractor?.name || 'Your preferred contractor'} has been notified.`
      : `No contractor on file for this category. Visit your dashboard to assign one manually.`

    await replyToLandlord(fromPhone, `✅ Approved. ${contractorNote}`)
  } else if (messageBody === 'NO' || messageBody === 'N') {
    // DECLINE
    await supabase
      .from('maintenance_requests')
      .update({ landlord_approval_status: 'declined' })
      .eq('id', request.id)

    if (request.tenants?.email) {
      await sendMaintenanceDeclined({
        tenantEmail: request.tenants.email,
        tenantName: request.tenants.first_name,
        title: request.title,
      })
    }

    await replyToLandlord(fromPhone, `Request declined. You can reassign it from your dashboard.`)
  } else {
    await replyToLandlord(fromPhone, `Reply YES to approve and dispatch, or NO to decline the maintenance request for: ${request.title}`)
  }

  return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  })
}
