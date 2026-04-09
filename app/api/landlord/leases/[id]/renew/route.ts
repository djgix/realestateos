import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { start_date, end_date, monthly_rent, security_deposit } = await req.json()

  if (!start_date || !monthly_rent || monthly_rent <= 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (end_date && end_date <= start_date) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
  }

  // Fetch old lease to verify ownership and copy fields
  const { data: oldLease } = await supabase
    .from('leases')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single()

  if (!oldLease) return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
  if (oldLease.status !== 'active') {
    return NextResponse.json({ error: 'Only active leases can be renewed' }, { status: 400 })
  }

  // Mark old lease as expired
  await supabase.from('leases').update({ status: 'expired' }).eq('id', id)

  // Create new lease
  const { data: newLease, error } = await supabase
    .from('leases')
    .insert({
      owner_id: user.id,
      property_id: oldLease.property_id,
      tenant_id: oldLease.tenant_id,
      state: oldLease.state,
      lease_type: oldLease.lease_type,
      start_date,
      end_date: end_date || null,
      monthly_rent,
      security_deposit: security_deposit ?? oldLease.security_deposit,
      late_fee: oldLease.late_fee,
      late_fee_days: oldLease.late_fee_days,
      rent_due_day: oldLease.rent_due_day,
      status: 'active',
      notes: oldLease.notes,
    })
    .select()
    .single()

  if (error || !newLease) {
    return NextResponse.json({ error: 'Failed to create renewal lease' }, { status: 500 })
  }

  // Generate 12 months of rent payment records for new lease
  const records = []
  const startD = new Date(start_date)
  const dueDay = oldLease.rent_due_day || 1
  const endD = end_date ? new Date(end_date) : null

  for (let i = 0; i < 12; i++) {
    const dueDate = new Date(startD.getFullYear(), startD.getMonth() + i, dueDay)
    if (endD && dueDate > endD) break
    records.push({
      owner_id: user.id,
      property_id: oldLease.property_id,
      tenant_id: oldLease.tenant_id,
      lease_id: newLease.id,
      amount: monthly_rent,
      total_amount: monthly_rent,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'pending',
      collections_actions_sent: [],
    })
  }

  if (records.length > 0) {
    await supabase.from('rent_payments').insert(records)
  }

  return NextResponse.json({ new_lease_id: newLease.id })
}
