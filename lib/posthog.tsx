'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: true,
      })
    }
  }, [])
  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Call these anywhere in the app to track key events
export const track = {
  // Landlord
  propertyAdded:       () => posthog.capture('property_added'),
  tenantAdded:         () => posthog.capture('tenant_added'),
  leaseGenerated:      (state: string) => posthog.capture('lease_generated', { state }),
  paymentRecorded:     () => posthog.capture('payment_recorded'),
  maintenanceCreated:  (priority: string) => posthog.capture('maintenance_created', { priority }),
  expenseLogged:       (category: string) => posthog.capture('expense_logged', { category }),
  easyButtonUsed:      (flow: string) => posthog.capture('easy_button_used', { flow }),
  legalGuideViewed:    (guide: string) => posthog.capture('legal_guide_viewed', { guide }),
  stripeConnected:     () => posthog.capture('stripe_connected'),
  rentCollected:       (amount: number) => posthog.capture('rent_collected', { amount }),
  // Seller
  listingCreated:      () => posthog.capture('listing_created'),
  offerReceived:       () => posthog.capture('offer_received'),
  documentGenerated:   (doc: string) => posthog.capture('document_generated', { doc }),
  // Buyer
  propertyTracked:     () => posthog.capture('property_tracked'),
  offerGenerated:      () => posthog.capture('offer_generated'),
  checklistCompleted:  () => posthog.capture('checklist_completed'),
  // Shared
  planUpgraded:        (plan: string) => posthog.capture('plan_upgraded', { plan }),
  checkoutStarted:     (product: string) => posthog.capture('checkout_started', { product }),
}
