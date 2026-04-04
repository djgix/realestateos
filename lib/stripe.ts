import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

// Create a Stripe Connect account for a landlord
export async function createConnectAccount(email: string) {
  const account = await stripe.accounts.create({
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
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/landlord/settings?stripe=refresh`,
    return_url:  `${baseUrl}/landlord/settings?stripe=success`,
    type: 'account_onboarding',
  })
  return accountLink
}

// Create a Stripe customer for a tenant
export async function createTenantCustomer(email: string, name: string) {
  const customer = await stripe.customers.create({ email, name })
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
}: {
  amount: number
  tenantCustomerId: string
  landlordAccountId: string
  propertyName: string
  tenantName: string
  platformFeePercent?: number
}) {
  const platformFee = Math.round(amount * (platformFeePercent / 100))

  const paymentIntent = await stripe.paymentIntents.create({
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
  })

  return paymentIntent
}

// Setup ACH payment method for tenant
export async function createSetupIntent(tenantCustomerId: string) {
  const setupIntent = await stripe.setupIntents.create({
    customer: tenantCustomerId,
    payment_method_types: ['us_bank_account'],
    usage: 'off_session',
  })
  return setupIntent
}
