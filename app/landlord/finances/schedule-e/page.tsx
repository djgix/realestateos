import { createClient } from '@/lib/supabase/server'
import ScheduleEClient from './ScheduleEClient'

export default async function ScheduleEPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString()

  const [
    { data: payments },
    { data: expenses },
    { data: properties }
  ] = await Promise.all([
    supabase.from('rent_payments').select('*').eq('owner_id', user!.id).eq('status', 'paid').gte('paid_date', startOfYear),
    supabase.from('expenses').select('*').eq('owner_id', user!.id).eq('tax_deductible', true).gte('date', startOfYear),
    supabase.from('properties').select('purchase_price').eq('owner_id', user!.id)
  ])

  // Map to IRS Lines
  // Line 3: Rents Received
  const line3_rents = payments?.reduce((sum, p) => sum + p.total_amount, 0) || 0

  // Deductions mapped to IRS Schedule E
  let deductions = {
    line5_advertising: 0,
    line6_auto: 0,
    line7_cleaning: 0,
    line8_commissions: 0,
    line9_insurance: 0,
    line10_legal: 0,
    line11_management: 0,
    line12_mortgage: 0,
    line13_other_interest: 0,
    line14_repairs: 0,
    line15_supplies: 0,
    line16_taxes: 0,
    line17_utilities: 0,
    line18_depreciation: 0, // Mock calculation
    line19_other: 0,
  }

  expenses?.forEach((e: any) => {
    switch(e.category) {
      case 'marketing': deductions.line5_advertising += e.amount; break;
      case 'insurance': deductions.line9_insurance += e.amount; break;
      case 'legal': deductions.line10_legal += e.amount; break;
      case 'management': deductions.line11_management += e.amount; break;
      case 'mortgage': deductions.line12_mortgage += e.amount; break; // usually interest only, simplified here
      case 'repairs': 
      case 'maintenance': deductions.line14_repairs += e.amount; break;
      case 'supplies': deductions.line15_supplies += e.amount; break;
      case 'taxes': deductions.line16_taxes += e.amount; break;
      case 'utilities': deductions.line17_utilities += e.amount; break;
      default: deductions.line19_other += e.amount; break;
    }
  })

  // Calculate depreciation: IRS allows straight-line depreciation over 27.5 years
  const propertiesWithPrice = (properties || []).filter((p: any) => p.purchase_price > 0)
  const propertiesMissingPrice = (properties || []).filter((p: any) => !p.purchase_price || p.purchase_price === 0).length
  deductions.line18_depreciation = propertiesWithPrice.reduce(
    (sum: number, p: any) => sum + p.purchase_price / 27.5,
    0
  )

  const totalExpenses = Object.values(deductions).reduce((a,b) => a + b, 0)
  const netIncome = line3_rents - totalExpenses

  return <ScheduleEClient rents={line3_rents} deductions={deductions} totalExpenses={totalExpenses} netIncome={netIncome} year={new Date().getFullYear()} propertiesMissingPrice={propertiesMissingPrice} />
}
