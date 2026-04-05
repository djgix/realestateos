import test from 'node:test'
import assert from 'node:assert/strict'

import { getIntegrationStatuses } from '../lib/integrations-status.ts'

test('getIntegrationStatuses marks live integrations by env health', () => {
  const statuses = getIntegrationStatuses({
    STRIPE_SECRET_KEY: 'sk_test',
    STRIPE_WEBHOOK_SECRET: 'whsec',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test',
    TWILIO_ACCOUNT_SID: 'sid',
  })

  const stripe = statuses.find((item) => item.id === 'stripe')
  const twilio = statuses.find((item) => item.id === 'twilio')
  const screening = statuses.find((item) => item.id === 'screening')

  assert.equal(stripe?.health, 'configured')
  assert.equal(twilio?.health, 'partial')
  assert.equal(screening?.health, 'planned')
  assert.equal(screening?.category, 'roadmap')
})
