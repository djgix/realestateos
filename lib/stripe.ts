import Stripe from 'stripe'

let _stripe: Stripe | undefined

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2024-06-20',
    })
  }
  return _stripe
}

// Create a Stripe Connect account for a landlord
export async function createConnectAccount(email: string) {
  const account = await getStripe().accounts.create({
    type: 'express',
    email,
    capabilities: {
      transfers: { requested: true },
      us_bank_account_ach_payments: { requested: true },
    },
  })
  return account
}

// Generate onboarding link for landlord to connect their bank
export async function createAccountLink(accountId: string, baseUrl: string) {
  const accountLink = await getStripe().accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/landlord/settings?stripe=refresh`,
    return_url:  `${baseUrl}/landlord/settings?stripe=success`,
    type: 'account_onboarding',
  })
  return accountLink
}

// Create a Stripe customer for a tenant
export async function createTenantCustomer(email: string, name: string) {
  const customer = await getStripe().customers.create({ email, name })
  return customer
}

// Collect rent from tenant and transfer to landlord
export async function collectRent({
  amount,        // in cents
  tenantCustomerId,
  landlordAccountId,
  propertyName,
  tenantName,
  platformFeePercent = 0, // We take 0% — landlord keeps everything
  idempotencyKey,
}: {
  amount: number
  tenantCustomerId: string
  landlordAccountId: string
  propertyName: string
  tenantName: string
  platformFeePercent?: number
  // Pass a value stable across retries for the same collection attempt (e.g. the
  // rent_payments row id) so a network failure between Stripe creating the intent and
  // this function returning can't result in two intents for one payment — a retry with
  // the same key returns the original intent instead of creating a new one.
  idempotencyKey?: string
}) {
  const platformFee = Math.round(amount * (platformFeePercent / 100))

  const paymentIntent = await getStripe().paymentIntents.create({
    amount,
    currency: 'usd',
    customer: tenantCustomerId,
    payment_method_types: ['us_bank_account'],
    transfer_data: {
      destination: landlordAccountId,
    },
    application_fee_amount: platformFee,
    description: `Rent payment — ${propertyName}`,
    metadata: {
      tenant_name: tenantName,
      property_name: propertyName,
    },
    confirm: false,
  }, idempotencyKey ? { idempotencyKey } : undefined)

  return paymentIntent
}

// Setup ACH payment method for tenant
export async function createSetupIntent(tenantCustomerId: string) {
  const setupIntent = await getStripe().setupIntents.create({
    customer: tenantCustomerId,
    payment_method_types: ['us_bank_account'],
    usage: 'off_session',
  })
  return setupIntent
}
