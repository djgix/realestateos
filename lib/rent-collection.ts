// Shared by app/api/rent/collect/route.ts and app/api/rent/collect-portal/route.ts.
// Releases a payment's CLAIMING marker back to its pre-claim value — but only if the row
// is still exactly CLAIMING. If persisting the real Stripe intent id timed out on our end
// but actually landed server-side, the row already holds that real id and this guard
// prevents clobbering it back to the stale previous value (which would sever the
// webhook's only way to find a payment Stripe may have actually charged).
// Best-effort, single attempt: retrying this write is deliberately NOT done — a retry
// loop reusing the same claimingMarker would have its own race if the first attempt's
// write actually committed (just lost its response) and a different request then claimed
// the now-released row before the retry ran, since the retry's WHERE clause can't tell
// "still my claim" apart from "someone else's brand new claim" once both are 'claiming'.
export async function releaseClaim(
  supabase: any,
  paymentId: string,
  previousIntentId: string | null,
  claimingMarker: string
) {
  await supabase
    .from('rent_payments')
    .update({ stripe_payment_intent_id: previousIntentId })
    .eq('id', paymentId)
    .eq('stripe_payment_intent_id', claimingMarker)
}
