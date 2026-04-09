import { POLAR_PRODUCTS } from './polar'

export function getCheckoutConfig(product: string, plan: string | undefined, baseUrl: string) {
  let productId: string
  let successUrl: string

  if (product === 'landlord') {
    productId = plan === 'growth' ? POLAR_PRODUCTS.landlord_growth
               : plan === 'pro'   ? POLAR_PRODUCTS.landlord_pro
               : POLAR_PRODUCTS.landlord_starter
    successUrl = `${baseUrl}/landlord/dashboard?upgraded=true`
  } else if (product === 'seller') {
    productId = POLAR_PRODUCTS.seller
    successUrl = `${baseUrl}/seller/dashboard?activated=true`
  } else if (product === 'buyer') {
    productId = POLAR_PRODUCTS.buyer
    successUrl = `${baseUrl}/buyer/dashboard?activated=true`
  } else if (product === 'bundle') {
    productId = POLAR_PRODUCTS.bundle
    successUrl = `${baseUrl}/landlord/dashboard?bundle=true`
  } else {
    throw new Error('Invalid product')
  }

  return { productId, successUrl }
}
