import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  const escaped = str.replace(/"/g, '""')
  // Sanitize formula injection
  if (/^[=+\-@]/.test(escaped)) return `"'${escaped}"`
  return `"${escaped}"`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('*, properties(name)')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  if (tenantsError) return NextResponse.json({ error: 'Failed to fetch tenants' }, { status: 500 })

  const rows = [
    ['First Name', 'Last Name', 'Email', 'Phone', 'Status', 'Property', 'Move-in Date', 'Monthly Income', 'Emergency Contact', 'Emergency Phone'],
    ...(tenants || []).map((t: any) => [
      t.first_name || '',
      t.last_name || '',
      t.email || '',
      t.phone || '',
      t.status || '',
      t.properties?.name || '',
      t.move_in_date || '',
      t.monthly_income || '',
      t.emergency_contact_name || '',
      t.emergency_contact_phone || '',
    ]),
  ]

  const csv = rows.map(r => r.map(v => csvCell(v)).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="tenants-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
