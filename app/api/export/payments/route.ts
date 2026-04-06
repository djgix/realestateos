import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: payments } = await supabase
    .from('rent_payments')
    .select('*, tenants(first_name, last_name), properties(name)')
    .eq('owner_id', user.id)
    .order('due_date', { ascending: false })

  const rows = [
    ['Date Due', 'Paid Date', 'Tenant', 'Property', 'Amount', 'Late Fee', 'Total', 'Status'],
    ...(payments || []).map((p: any) => [
      p.due_date || '',
      p.paid_date || '',
      `${p.tenants?.first_name || ''} ${p.tenants?.last_name || ''}`.trim(),
      p.properties?.name || '',
      p.amount || 0,
      p.late_fee || 0,
      p.total_amount || 0,
      p.status || '',
    ]),
  ]

  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="payments-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
