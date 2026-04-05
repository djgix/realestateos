/** State-specific lease hints (not legal advice). */
const HINTS: Record<string, string[]> = {
  CA: [
    'California limits certain late fees and security deposit handling — verify local rent control.',
    'Just-cause eviction rules may apply in many CA cities.',
  ],
  NY: [
    'NYC and other NY localities have strong tenant protections — confirm window guard and lead notices if applicable.',
  ],
  TX: [
    'Texas requires specific notice periods for non-payment — align with your property management workflow.',
  ],
  default: [
    'Have an attorney review state-required disclosures before signing.',
    'Ensure smoke/CO detector compliance matches local ordinance.',
  ],
}

export function leaseHintsForState(stateCode: string): string[] {
  const u = stateCode.toUpperCase()
  return HINTS[u] ?? HINTS.default
}
