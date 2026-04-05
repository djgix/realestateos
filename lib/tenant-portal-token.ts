import { createHmac, timingSafeEqual } from 'crypto'

function secret() {
  return process.env.TENANT_PORTAL_SECRET || process.env.CRON_SECRET || 'dev-only-change-me'
}

export function signTenantToken(tenantId: string): string {
  const h = createHmac('sha256', secret()).update(tenantId).digest('base64url')
  return h.slice(0, 32)
}

export function verifyTenantToken(tenantId: string, token: string): boolean {
  const expected = signTenantToken(tenantId)
  try {
    const a = Buffer.from(expected)
    const b = Buffer.from(token)
    return a.length === b.length && timingSafeEqual(a, b)
  } catch {
    return false
  }
}
