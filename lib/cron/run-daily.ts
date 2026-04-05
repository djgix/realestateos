import {
  addDays,
  format,
  parseISO,
  differenceInCalendarDays,
  getISOWeek,
  getISOWeekYear,
  isMonday,
} from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import type { SupabaseClient } from '@supabase/supabase-js'
import { insertAutomationEvent } from '@/lib/automation-events'
import { collectionEscalationThresholds } from '@/lib/collections'
import { parseLandlordPreferences } from '@/lib/landlord-preferences'
import {
  sendLateRentAlert,
  sendLeaseExpiry,
  sendRentReminder,
  sendWeeklyDigest,
  sendSoftCollectionsToTenant,
} from '@/lib/emails'
import { sendSms } from '@/lib/twilio'
import { logCron } from '@/lib/observability'
import { isQuietHoursNow } from '@/lib/quiet-hours'

function ymdAddDays(ymd: string, n: number) {
  return format(addDays(parseISO(`${ymd}T12:00:00`), n), 'yyyy-MM-dd')
}

export async function runDailyAutomation(admin: SupabaseClient) {
  const counts = {
    marked_late: 0,
    rent_rows_created: 0,
    lease_expiry_sent: 0,
    reminders_sent: 0,
    late_alerts_sent: 0,
    collections_sent: 0,
    weekly_sent: 0,
    errors: 0,
  }

  try {
    const { error: lateErr } = await admin
      .from('rent_payments')
      .update({ status: 'late' })
      .eq('status', 'pending')
      .lt('due_date', format(new Date(), 'yyyy-MM-dd'))
    if (lateErr) counts.errors++
    else {
      const { count } = await admin
        .from('rent_payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'late')
      counts.marked_late = count ?? 0
    }
  } catch {
    counts.errors++
  }

  const { data: leases } = await admin
    .from('leases')
    .select('*, tenants(*), properties(*)')
    .eq('status', 'active')

  const { data: payOwnerRows } = await admin.from('rent_payments').select('owner_id').limit(10000)
  const ownerIdSet = new Set<string>()
  ;(leases ?? []).forEach((l: { owner_id: string }) => ownerIdSet.add(l.owner_id))
  ;(payOwnerRows ?? []).forEach((r: { owner_id: string }) => ownerIdSet.add(r.owner_id))
  const ownerIds = [...ownerIdSet]

  type ProfRow = {
    id: string
    email: string
    phone: string | null
    landlord_preferences: unknown
    business_address: string | null
    full_name: string | null
  }
  const { data: profiles } = ownerIds.length
    ? await admin
        .from('profiles')
        .select('id, email, phone, landlord_preferences, business_address, full_name')
        .in('id', ownerIds)
    : { data: [] as ProfRow[] }

  const profMap = new Map((profiles ?? []).map((p) => [p.id, p]))

  for (const lease of leases ?? []) {
    const prof = profMap.get(lease.owner_id)
    if (!prof) continue
    const prefs = parseLandlordPreferences(prof.landlord_preferences)
    const tz = prefs.automation.timezone
    const todayYmd = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd')
    const compliance = { businessAddress: prof.business_address }

    const y = Number(todayYmd.slice(0, 4))
    const m = Number(todayYmd.slice(5, 7))
    const dim = new Date(y, m, 0).getDate()
    const day = Math.min(Number(lease.rent_due_day) || 1, dim)
    const dueYmd = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    const startM = `${y}-${String(m).padStart(2, '0')}-01`
    const nextM = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`

    const { data: existingRow } = await admin
      .from('rent_payments')
      .select('id')
      .eq('lease_id', lease.id)
      .gte('due_date', startM)
      .lt('due_date', nextM)
      .maybeSingle()

    if (!existingRow) {
      const { error: insErr } = await admin.from('rent_payments').insert({
        owner_id: lease.owner_id,
        property_id: lease.property_id,
        tenant_id: lease.tenant_id,
        lease_id: lease.id,
        amount: lease.monthly_rent,
        late_fee: 0,
        total_amount: lease.monthly_rent,
        due_date: dueYmd,
        status: 'pending',
      })
      if (!insErr) {
        counts.rent_rows_created++
        await insertAutomationEvent(admin, {
          owner_id: lease.owner_id,
          kind: 'rent_row_generated',
          dedupe_key: `rent_row:${lease.id}:${dueYmd}`,
          channel: 'system',
          summary: `Scheduled rent due ${dueYmd}`,
          metadata: { lease_id: lease.id, due_date: dueYmd },
        })
      }
    }

    const endStr = lease.end_date as string
    if (prefs.notifications.email_lease_expiry && !isQuietHoursNow(prefs)) {
      for (const offset of prefs.automation.lease_expiry_notice_days) {
        if (ymdAddDays(todayYmd, offset) !== endStr) continue
        const dk = `lease_expiry:${lease.id}:${offset}:${todayYmd}`
        const ok = await insertAutomationEvent(admin, {
          owner_id: lease.owner_id,
          kind: 'lease_expiry_notice',
          dedupe_key: dk,
          channel: 'email',
          summary: `Lease expiry notice (${offset}d) — ${lease.tenants?.first_name ?? ''}`,
          metadata: { lease_id: lease.id },
        })
        if (!ok.inserted) continue
        try {
          await sendLeaseExpiry({
            landlordEmail: prof.email,
            tenantName: `${lease.tenants?.first_name ?? ''} ${lease.tenants?.last_name ?? ''}`.trim(),
            propertyName: lease.properties?.name ?? 'Property',
            expiryDate: endStr,
            daysLeft: offset,
            compliance,
          })
          counts.lease_expiry_sent++
        } catch {
          counts.errors++
        }
      }
    }
  }

  const { data: payments } = await admin
    .from('rent_payments')
    .select('*, tenants(*), properties(*)')
    .in('status', ['pending', 'late'])

  for (const p of payments ?? []) {
    const prof = profMap.get(p.owner_id)
    if (!prof) continue
    const prefs = parseLandlordPreferences(prof.landlord_preferences)
    const tz = prefs.automation.timezone
    const todayYmd = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd')
    const compliance = { businessAddress: prof.business_address }
    const due = p.due_date as string
    const tenant = p.tenants
    const propertyName = p.properties?.name ?? 'your property'

    const lead = prefs.automation.rent_reminder_days_before

    if (
      p.status === 'pending' &&
      prefs.notifications.email_rent_reminder &&
      !isQuietHoursNow(prefs) &&
      ymdAddDays(todayYmd, lead) === due
    ) {
      if (tenant?.email_notifications === false) continue
      const dk = `rent_remind:${p.id}:${todayYmd}`
      const ok = await insertAutomationEvent(admin, {
        owner_id: p.owner_id,
        kind: 'rent_reminder',
        dedupe_key: dk,
        channel: 'email',
        summary: `Rent reminder — ${tenant?.first_name ?? 'Tenant'}`,
        metadata: { payment_id: p.id },
      })
      if (!ok.inserted) continue
      try {
        await sendRentReminder({
          tenantEmail: tenant?.email,
          tenantName: `${tenant?.first_name ?? ''} ${tenant?.last_name ?? ''}`.trim(),
          amount: Number(p.total_amount),
          dueDate: due,
          propertyName,
          compliance,
        })
        counts.reminders_sent++
        if (prefs.notifications.sms_rent_reminder && tenant?.phone) {
          const sms = await sendSms({
            to: tenant.phone,
            body: `Rent reminder: ${propertyName} — $${Number(p.total_amount)} due ${due}.`,
          })
          if (sms.sent) {
            await insertAutomationEvent(admin, {
              owner_id: p.owner_id,
              kind: 'rent_reminder_sms',
              dedupe_key: `${dk}:sms`,
              channel: 'sms',
              summary: `SMS rent reminder`,
              metadata: { payment_id: p.id },
            })
          }
        }
      } catch {
        counts.errors++
      }
    }

    if (p.status === 'late' && prefs.notifications.email_late_rent && !isQuietHoursNow(prefs)) {
      const daysL = Math.max(0, differenceInCalendarDays(parseISO(`${todayYmd}T12:00:00`), parseISO(`${due}T12:00:00`)))
      const dk = `landlord_late:${p.id}:${todayYmd}`
      const ok = await insertAutomationEvent(admin, {
        owner_id: p.owner_id,
        kind: 'landlord_late_rent',
        dedupe_key: dk,
        channel: 'email',
        summary: `Late rent alert — ${tenant?.first_name ?? ''}`,
        metadata: { payment_id: p.id, days_late: daysL },
      })
      if (ok.inserted) {
        try {
          await sendLateRentAlert({
            landlordEmail: prof.email,
            tenantName: `${tenant?.first_name ?? ''} ${tenant?.last_name ?? ''}`.trim(),
            propertyName,
            amount: Number(p.total_amount),
            daysLate: daysL,
            compliance,
          })
          counts.late_alerts_sent++
          if (prefs.notifications.sms_late_rent && prof.phone) {
            await sendSms({
              to: prof.phone,
              body: `Late rent: ${tenant?.first_name} at ${propertyName} — $${p.total_amount} (${daysL}d).`,
            })
          }
        } catch {
          counts.errors++
        }
      }
    }

    if (
      p.status === 'late' &&
      tenant?.email &&
      tenant.email_notifications !== false &&
      !isQuietHoursNow(prefs)
    ) {
      const daysL = Math.max(0, differenceInCalendarDays(parseISO(`${todayYmd}T12:00:00`), parseISO(`${due}T12:00:00`)))
      const thresholds = collectionEscalationThresholds(
        prefs.collections.soft_days_late,
        prefs.collections.hard_days_late
      )
      if (thresholds.includes(daysL)) {
        const dk = `collections_tenant:${p.id}:day${daysL}:${todayYmd}`
        const ok = await insertAutomationEvent(admin, {
          owner_id: p.owner_id,
          kind: 'collections_escalation',
          dedupe_key: dk,
          channel: 'email',
          summary: `Collections day ${daysL} — ${tenant?.first_name ?? ''}`,
          metadata: { payment_id: p.id },
        })
        if (ok.inserted) {
          try {
            await sendSoftCollectionsToTenant({
              tenantEmail: tenant.email,
              tenantName: tenant.first_name ?? 'there',
              propertyName,
              amount: Number(p.total_amount),
              daysLate: daysL,
              tone: prefs.collections.tone,
              compliance,
            })
            counts.collections_sent++
          } catch {
            counts.errors++
          }
        }
      }
    }
  }

  if (isMonday(new Date())) {
    for (const prof of profiles ?? []) {
      const prefs = parseLandlordPreferences(prof.landlord_preferences)
      if (!prefs.notifications.email_weekly_summary || isQuietHoursNow(prefs)) continue
      const wk = getISOWeek(new Date())
      const yr = getISOWeekYear(new Date())
      const dk = `weekly:${prof.id}:${yr}-W${wk}`
      const ok = await insertAutomationEvent(admin, {
        owner_id: prof.id,
        kind: 'weekly_digest',
        dedupe_key: dk,
        channel: 'email',
        summary: 'Weekly portfolio summary',
        metadata: {},
      })
      if (!ok.inserted) continue
      const { count: lateC } = await admin
        .from('rent_payments')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', prof.id)
        .eq('status', 'late')
      const { count: openM } = await admin
        .from('maintenance_requests')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', prof.id)
        .neq('status', 'completed')
      const lines = [
        `Late rent payments: ${lateC ?? 0}`,
        `Open maintenance tickets: ${openM ?? 0}`,
        `Review your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || ''}/landlord/dashboard`,
      ]
      try {
        await sendWeeklyDigest({
          landlordEmail: prof.email,
          landlordName: prof.full_name?.split(' ')[0] || 'there',
          lines,
          compliance: { businessAddress: prof.business_address },
        })
        counts.weekly_sent++
      } catch {
        counts.errors++
      }
    }
  }

  logCron('daily_complete', counts as unknown as Record<string, unknown>)
  return counts
}
