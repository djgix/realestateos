// Shared by app/api/rent/collect/route.ts and app/api/rent/collect-portal/route.ts.
// Releases a payment's CLAIMING marker back to its pre-claim value — but only if the row
// is still exactly CLAIMING. If persisting the real Stripe intent id timed out on our end
// but actually landed server-side, the row already holds that real id and this guard
// prevents clobbering it back to the stale previous value (which would sever the
// webhook's only way to find a payment Stripe may have actually charged).
// Best-effort: retries once on its own write failure, then gives up silently — there's no
// further recovery action available from within this request.
export async function releaseClaim(
  supabase: any,
  paymentId: string,
  previousIntentId: string | null,
  claimingMarker: string
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { error } = await supabase
      .from('rent_payments')
      .update({ stripe_payment_intent_id: previousIntentId })
      .eq('id', paymentId)
      .eq('stripe_payment_intent_id', claimingMarker)
    if (!error) return
  }
}
