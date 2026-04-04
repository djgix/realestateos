import Polar from '@polar-sh/sdk'

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
})

// Create a Polar checkout session
export async function createCheckout({
  productId,
  customerEmail,
  successUrl,
  metadata,
}: {
  productId: string
  customerEmail: string
  successUrl: string
  metadata?: Record<string, string>
}) {
  const checkout = await polar.checkouts.create({
    productId,
    customerEmail,
    successUrl,
    metadata,
  })
  return checkout
}

// Product IDs from your Polar dashboard
export const POLAR_PRODUCTS = {
  landlord_starter: process.env.NEXT_PUBLIC_POLAR_LANDLORD_STARTER_ID!,
  landlord_growth:  process.env.NEXT_PUBLIC_POLAR_LANDLORD_GROWTH_ID!,
  landlord_pro:     process.env.NEXT_PUBLIC_POLAR_LANDLORD_PRO_ID!,
  seller:           process.env.NEXT_PUBLIC_POLAR_SELLER_ID!,
  buyer:            process.env.NEXT_PUBLIC_POLAR_BUYER_ID!,
  bundle:           process.env.NEXT_PUBLIC_POLAR_BUNDLE_ID!,
}

// Pricing display
export const PRICING = {
  landlord: {
    starter: { price: 19, label: 'Starter', properties: 2, units: 4 },
    growth:  { price: 39, label: 'Growth',  properties: 10, units: 999 },
    pro:     { price: 79, label: 'Pro',      properties: 999, units: 999 },
  },
  seller: { price: 299, label: 'SellerOS — Sell without an agent' },
  buyer:  { price: 149, label: 'BuyerOS — Buy with confidence' },
  bundle: { price: 99,  label: 'REALESTATEos Pro — All three products/month' },
}
