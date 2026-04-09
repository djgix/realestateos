import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvCell(value: string | number | null | undefined): string {
  const str = String(value ?? '')
  const escaped = str.replace(/"/g, '""')
  // Sanitize formula injection
  if (/^[\s\t\r\n]*[=+\-@]/.test(escaped)) return `"'${escaped}"`
  return `"${escaped}"`
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: expenses } = await supabase
    .from('expenses')
    .select('*, properties(name)')
    .eq('owner_id', user.id)
    .order('date', { ascending: false })

  const rows = [
    ['Date', 'Description', 'Category', 'Property', 'Amount', 'Tax Deductible', 'Vendor'],
    ...(expenses || []).map((e: any) => [
      e.date || '',
      e.description || '',
      e.category || '',
      e.properties?.name || '',
      e.amount || 0,
      e.tax_deductible ? 'Yes' : 'No',
      e.vendor || '',
    ]),
  ]

  const csv = rows.map(r => r.map(v => csvCell(v)).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="expenses-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
