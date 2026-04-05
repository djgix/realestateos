/** Plain-English screening from stored fields (plug in Checkr later). */
export function summarizeScreening(tenant: {
  background_check_status: string
  credit_score: number | null
  monthly_income: number | null
}): { text: string; recommendation: 'approve' | 'review' | 'decline' } {
  const bg = tenant.background_check_status
  const cs = tenant.credit_score
  if (bg === 'failed') {
    return { text: 'Background check reported issues. Review details before proceeding.', recommendation: 'decline' }
  }
  if (cs != null && cs < 580) {
    return { text: `Credit score ${cs} is below typical thresholds — consider guarantor or larger deposit.`, recommendation: 'review' }
  }
  if (bg === 'passed' && cs != null && cs >= 650) {
    return { text: `Background clear; credit ${cs} looks solid for most markets.`, recommendation: 'approve' }
  }
  return { text: 'Incomplete screening data — run checks or collect more income / reference documentation.', recommendation: 'review' }
}
