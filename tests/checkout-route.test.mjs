import test from 'node:test'
import assert from 'node:assert/strict'

test('getCheckoutConfig returns landlord starter and correct success URL by default', async () => {
  process.env.NEXT_PUBLIC_POLAR_LANDLORD_STARTER_ID = 'starter-id'
  process.env.NEXT_PUBLIC_POLAR_LANDLORD_GROWTH_ID = 'growth-id'
  process.env.NEXT_PUBLIC_POLAR_LANDLORD_PRO_ID = 'pro-id'
  process.env.NEXT_PUBLIC_POLAR_SELLER_ID = 'seller-id'
  process.env.NEXT_PUBLIC_POLAR_BUYER_ID = 'buyer-id'
  process.env.NEXT_PUBLIC_POLAR_BUNDLE_ID = 'bundle-id'

  const { getCheckoutConfig } = await import('../lib/checkout.ts')

  const landlordStarter = getCheckoutConfig('landlord', undefined, 'https://localhost')
  assert.deepEqual(landlordStarter, {
    productId: 'starter-id',
    successUrl: 'https://localhost/landlord/dashboard?upgraded=true',
  })

  const landlordGrowth = getCheckoutConfig('landlord', 'growth', 'https://localhost')
  assert.deepEqual(landlordGrowth, {
    productId: 'growth-id',
    successUrl: 'https://localhost/landlord/dashboard?upgraded=true',
  })

  const seller = getCheckoutConfig('seller', undefined, 'https://localhost')
  assert.deepEqual(seller, {
    productId: 'seller-id',
    successUrl: 'https://localhost/seller/dashboard?activated=true',
  })

  const buyer = getCheckoutConfig('buyer', undefined, 'https://localhost')
  assert.deepEqual(buyer, {
    productId: 'buyer-id',
    successUrl: 'https://localhost/buyer/dashboard?activated=true',
  })

  const bundle = getCheckoutConfig('bundle', undefined, 'https://localhost')
  assert.deepEqual(bundle, {
    productId: 'bundle-id',
    successUrl: 'https://localhost/landlord/dashboard?bundle=true',
  })
})

test('getCheckoutConfig throws for invalid product values', async () => {
  const { getCheckoutConfig } = await import('../lib/checkout.ts')
  assert.throws(() => getCheckoutConfig('invalid-product', undefined, 'https://localhost'), {
    message: 'Invalid product',
  })
})
