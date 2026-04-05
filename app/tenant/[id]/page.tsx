import { TenantBankClient } from './TenantBankClient'

export default async function TenantPortalPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    t?: string
    setup?: string
    setup_intent?: string
    setup_intent_client_secret?: string
    redirect_status?: string
  }>
}) {
  const { id } = await params
  const sp = await searchParams
  const token = sp.t || ''

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full card p-8 border-slate-800">
        <h1 className="font-display text-2xl text-slate-100 mb-2">Rent payment setup</h1>
        <p className="text-slate-400 text-sm mb-6">
          Add a US bank account for ACH rent payments. This secure page was shared by your landlord.
        </p>
        {!token ? (
          <p className="text-amber-400 text-sm">Missing access token. Open the full link from your invitation email or message.</p>
        ) : (
          <TenantBankClient
            tenantId={id}
            token={token}
            setupIntentId={sp.setup_intent}
            setupIntentClientSecret={sp.setup_intent_client_secret}
            redirectStatus={sp.redirect_status}
          />
        )}
      </div>
    </div>
  )
}
