// Shared portal-access check, mirrored from app/tenant/[token]/page.tsx so every
// portal-token API route rejects the same tenants the display page already blocks
// (ended tenancy, or the landlord globally disabled the portal).
export function isPortalAccessible(tenant: { status?: string | null }, profile?: { settings?: any } | null) {
  const portalEnabled = profile?.settings?.portal?.enabled !== false
  const tenancyEnded = tenant.status === 'past' || tenant.status === 'evicted'
  return portalEnabled && !tenancyEnded
}
