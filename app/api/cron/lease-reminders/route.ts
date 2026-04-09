import { NextRequest, NextResponse } from 'next/server'
import { getServiceClient } from '@/lib/supabase/service'
import { sendLeaseExpiry } from '@/lib/emails'
import { getDaysUntil } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || req.nextUrl.searchParams.get('secret')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient() as any

  // Find active leases expiring within 60 days
  const today = new Date().toISOString().split('T')[0]
  const in60 = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: leases } = await supabase
    .from('leases')
    .select('*, tenants(first_name, last_name), properties(name), profiles!owner_id(email, full_name)')
    .eq('status', 'active')
    .gte('end_date', today)
    .lte('end_date', in60)

  const results: string[] = []

  for (const lease of leases || []) {
    const landlordProfile = Array.isArray(lease.profiles) ? lease.profiles[0] : lease.profiles
    if (!landlordProfile?.email) continue

    const daysLeft = getDaysUntil(lease.end_date)
    // Only send at 60, 30, 14, and 7 day marks to avoid spam
    if (![60, 30, 14, 7].some(d => Math.abs(daysLeft - d) <= 1)) continue

    const tenantName = lease.tenants
      ? `${lease.tenants.first_name} ${lease.tenants.last_name}`
      : 'Unknown tenant'
    const propertyName = lease.properties?.name || 'Unknown property'

    await sendLeaseExpiry({
      landlordEmail: landlordProfile.email,
      tenantName,
      propertyName,
      expiryDate: lease.end_date,
      daysLeft,
    })

    results.push(`${tenantName} @ ${propertyName} (${daysLeft}d)`)
  }

  return NextResponse.json({ success: true, reminders_sent: results.length, details: results })
}
