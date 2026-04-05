/** Rule-based triage; replace with LLM when OPENAI_API_KEY is set. */
export function triageMaintenanceDescription(description: string): {
  severity: 'emergency' | 'high' | 'normal' | 'low'
  summary: string
  suggestedTrade: string
} {
  const d = description.toLowerCase()
  if (/gas\s*leak|flood|no\s*heat|spark|fire|electrocut/i.test(d)) {
    return {
      severity: 'emergency',
      summary: 'Possible habitability or safety emergency — contact tenant and dispatch licensed help quickly.',
      suggestedTrade: 'Emergency / on-call',
    }
  }
  if (/leak|water|toilet|clog|drain|pipe|sewer/i.test(d)) {
    return { severity: 'high', summary: 'Water or drain issue — prioritize to limit property damage.', suggestedTrade: 'Plumber' }
  }
  if (/electric|outlet|breaker|light|power/i.test(d)) {
    return { severity: 'high', summary: 'Electrical issue — use a licensed electrician.', suggestedTrade: 'Electrician' }
  }
  if (/hvac|ac|heat|furnace|air\s*condition/i.test(d)) {
    return { severity: 'normal', summary: 'HVAC — schedule qualified HVAC technician.', suggestedTrade: 'HVAC' }
  }
  return { severity: 'normal', summary: 'Standard maintenance — schedule during business hours.', suggestedTrade: 'General handyman' }
}
