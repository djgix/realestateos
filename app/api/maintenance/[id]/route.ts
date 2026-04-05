import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { insertAutomationEvent } from '@/lib/automation-events'
import { sendMaintenanceUpdate } from '@/lib/emails'
import { sendSms } from '@/lib/twilio'
import { parseLandlordPreferences } from '@/lib/landlord-preferences'
import { rateLimit } from '@/lib/rate-limit'
import { isQuietHoursNow } from '@/lib/quiet-hours'

function formatStatus(value: string | null | undefined) {
  return (value || 'unset').replace(/_/g, ' ')
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'cleared'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!rateLimit(`maint:${user.id}`, 40, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const body = await req.json()
  const {
    status,
    scheduled_date,
    completed_date,
    notes,
    notify_tenant,
    actual_cost,
    contractor_name,
    contractor_phone,
  } = body as {
    status?: string
    scheduled_date?: string | null
    completed_date?: string | null
    notes?: string | null
    notify_tenant?: boolean
    actual_cost?: number | null
    contractor_name?: string | null
    contractor_phone?: string | null
  }

  const { data: row, error: fetchErr } = await supabase
    .from('maintenance_requests')
    .select('*, tenants(email, first_name, last_name, phone, email_notifications), properties(name)')
    .eq('id', id)
    .single()
  if (fetchErr || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (row.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const prevStatus = row.status
  const prevSched = row.scheduled_date

  const patch: Record<string, unknown> = {}
  if (status) patch.status = status
  if (scheduled_date !== undefined) patch.scheduled_date = scheduled_date
  if (completed_date !== undefined) patch.completed_date = completed_date
  if (notes !== undefined) patch.notes = notes
  if (actual_cost !== undefined) patch.actual_cost = actual_cost
  if (contractor_name !== undefined) patch.contractor_name = contractor_name
  if (contractor_phone !== undefined) patch.contractor_phone = contractor_phone

  const { data: updated, error: upErr } = await supabase
    .from('maintenance_requests')
    .update(patch)
    .eq('id', id)
    .select('*, tenants(email, first_name, last_name, phone, email_notifications), properties(name)')
    .single()
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 })

  const notify = notify_tenant !== false
  const statusChanged = status && status !== prevStatus
  const schedChanged = scheduled_date !== undefined && scheduled_date !== prevSched
  const tenant = updated.tenants
  const auditBits: string[] = []

  if (statusChanged) {
    auditBits.push(`status ${formatStatus(prevStatus)} -> ${formatStatus(updated.status)}`)
  }
  if (schedChanged) {
    auditBits.push(
      updated.scheduled_date
        ? `scheduled ${formatDateTime(updated.scheduled_date)}`
        : 'schedule cleared'
    )
  }
  if (actual_cost !== undefined) {
    auditBits.push(
      updated.actual_cost != null
        ? `actual cost $${Number(updated.actual_cost).toFixed(2)}`
        : 'actual cost cleared'
    )
  }
  if (contractor_name !== undefined || contractor_phone !== undefined) {
    if (updated.contractor_name || updated.contractor_phone) {
      auditBits.push(
        `contractor ${[updated.contractor_name, updated.contractor_phone].filter(Boolean).join(' · ')}`
      )
    } else {
      auditBits.push('contractor cleared')
    }
  }
  if (notes !== undefined && notes !== row.notes) {
    auditBits.push('internal notes updated')
  }

  let notificationStatus:
    | 'sent'
    | 'quiet_hours'
    | 'not_requested'
    | 'not_applicable'
    | 'failed' = notify ? 'not_applicable' : 'not_requested'

  if (
    notify &&
    tenant?.email &&
    tenant.email_notifications !== false &&
    (statusChanged || schedChanged)
  ) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('landlord_preferences, business_address')
      .eq('id', user.id)
      .single()
    const prefs = parseLandlordPreferences(prof?.landlord_preferences)
    if (isQuietHoursNow(prefs)) {
      notificationStatus = 'quiet_hours'
      await insertAutomationEvent(supabase, {
        owner_id: user.id,
        kind: 'maintenance_update_deferred',
        dedupe_key: `maint_notify_deferred:${id}:${updated.updated_at}`,
        channel: 'system',
        summary: `Tenant notification deferred by quiet hours — ${updated.title}`,
        metadata: { maintenance_id: id, status: updated.status, scheduled_date: updated.scheduled_date },
      })
    } else {
      const compliance = { businessAddress: prof?.business_address }
      const schedLabel = updated.scheduled_date
        ? new Date(updated.scheduled_date).toLocaleString('en-US')
        : undefined
      try {
        await sendMaintenanceUpdate({
          tenantEmail: tenant.email,
          tenantName: `${tenant.first_name ?? ''} ${tenant.last_name ?? ''}`.trim(),
          title: updated.title,
          status: updated.status,
          scheduledDate: schedLabel,
          compliance,
        })
        let channel: 'email' | 'both' = 'email'
        if (prefs.notifications.sms_maintenance_update && tenant.phone) {
          const sms = await sendSms({
            to: tenant.phone,
            body: `Maintenance "${updated.title}": ${updated.status.replace('_', ' ')}${schedLabel ? `. Scheduled: ${schedLabel}` : ''}`,
          })
          if (sms.sent) channel = 'both'
        }
        notificationStatus = 'sent'
        await insertAutomationEvent(supabase, {
          owner_id: user.id,
          kind: 'maintenance_update_sent',
          dedupe_key: `maint_notify:${id}:${updated.updated_at}`,
          channel,
          summary: `Tenant notified — ${updated.title}`,
          metadata: { maintenance_id: id, status: updated.status, scheduled_date: updated.scheduled_date },
        })
      } catch (error) {
        console.error('[maintenance notify]', error)
        notificationStatus = 'failed'
      }
    }
  }

  await insertAutomationEvent(supabase, {
    owner_id: user.id,
    kind: 'maintenance_updated',
    dedupe_key: `maint_update:${id}:${updated.updated_at}`,
    channel: 'system',
    summary: auditBits.length ? `${updated.title}: ${auditBits.join(' · ')}` : `${updated.title}: maintenance record updated`,
    metadata: {
      maintenance_id: id,
      status: updated.status,
      scheduled_date: updated.scheduled_date,
      notification_status: notificationStatus,
    },
  })

  return NextResponse.json({ maintenance: updated, notification_status: notificationStatus })
}
