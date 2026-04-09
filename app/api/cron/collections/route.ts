import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { sendSMS } from '@/lib/twilio'
import { sendRentReminder, sendLateRentAlert } from '@/lib/emails'

interface CollectionStep {
  day: number
  label: string
  channel: 'sms' | 'email' | 'both'
  auto_send: boolean
  message: string
}

interface CollectionsConfig {
  enabled: boolean
  grace_days: number
  steps: CollectionStep[]
}

function interpolate(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`))
}

export async function POST(req: NextRequest) {
  // Protect with CRON_SECRET
  const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient() as any
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get all landlords with collections enabled
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, phone, collections_config')
    .not('collections_config', 'is', null) as { data: Array<{ id: string; full_name: string | null; email: string | null; phone: string | null; collections_config: CollectionsConfig }> | null }

  const results: { landlord: string; actions: string[] }[] = []

  for (const profile of profiles || []) {
    const config: CollectionsConfig = profile.collections_config
    if (!config?.enabled || !config?.steps?.length) continue

    const landlordActions: string[] = []

    // Get all late payments for this landlord
    const { data: payments } = await supabase
      .from('rent_payments')
      .select('*, tenants(first_name, last_name, email, phone), properties(name, collections_config)')
      .eq('owner_id', profile.id)
      .eq('status', 'late') as {
        data: Array<{
          id: string; total_amount: number; due_date: string;
          collections_actions_sent: string[] | null;
          tenants: { first_name: string; last_name: string; email: string | null; phone: string | null } | null;
          properties: { name: string; collections_config: CollectionsConfig | null } | null;
        }> | null
      }

    for (const payment of payments || []) {
      const dueDate = new Date(payment.due_date)
      dueDate.setHours(0, 0, 0, 0)
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / 86400000)

      // Resolve config: property override ?? global
      const effectiveConfig: CollectionsConfig =
        payment.properties?.collections_config ?? config

      const actionsSent: string[] = payment.collections_actions_sent || []

      // Find applicable steps
      for (const step of effectiveConfig.steps) {
        const stepKey = `day_${step.day}_${step.label.toLowerCase().replace(/\s+/g, '_')}`

        // Skip if already sent, or days not reached yet
        if (actionsSent.includes(stepKey)) continue
        if (daysLate < step.day) continue
        if (!step.auto_send) continue // Manual steps skip in cron

        const tenant = payment.tenants
        if (!tenant) continue

        const vars = {
          first_name: tenant.first_name,
          full_name: `${tenant.first_name} ${tenant.last_name}`,
          amount: `$${payment.total_amount}`,
          due_date: payment.due_date,
          days_late: daysLate,
          property: payment.properties?.name || 'your property',
        }

        const message = interpolate(step.message, vars)

        // Send via configured channel
        if ((step.channel === 'sms' || step.channel === 'both') && tenant.phone) {
          await sendSMS(tenant.phone, message)
        }

        if (step.channel === 'email' || step.channel === 'both') {
          // Use sendRentReminder format for compatibility
          if (profile.email) {
            await sendLateRentAlert({
              landlordEmail: profile.email ?? '',
              tenantName: `${tenant.first_name} ${tenant.last_name}`,
              propertyName: payment.properties?.name || '',
              amount: payment.total_amount,
              daysLate,
            })
          }
        }

        // Mark as sent
        await (supabase
          .from('rent_payments') as any)
          .update({
            collections_actions_sent: [...actionsSent, stepKey],
          })
          .eq('id', payment.id)

        landlordActions.push(`${stepKey} → ${tenant.first_name} ${tenant.last_name} (${daysLate}d late)`)
        break // One step per payment per run
      }
    }

    if (landlordActions.length > 0) {
      results.push({ landlord: profile.email ?? '', actions: landlordActions })
    }
  }

  return NextResponse.json({ success: true, processed: results })
}
