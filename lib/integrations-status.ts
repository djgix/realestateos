export type IntegrationHealth = 'configured' | 'partial' | 'missing' | 'planned'

export type IntegrationStatus = {
  id: string
  label: string
  category: 'live' | 'roadmap'
  health: IntegrationHealth
  summary: string
  envKeys: string[]
}

function present(env: NodeJS.ProcessEnv, key: string) {
  return Boolean(env[key])
}

function healthFromKeys(env: NodeJS.ProcessEnv, keys: string[]): IntegrationHealth {
  const hits = keys.filter((key) => present(env, key)).length
  if (hits === 0) return 'missing'
  if (hits === keys.length) return 'configured'
  return 'partial'
}

export function getIntegrationStatuses(env: NodeJS.ProcessEnv = process.env): IntegrationStatus[] {
  const stripeKeys = [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  ]
  const polarKeys = [
    'POLAR_ACCESS_TOKEN',
    'POLAR_WEBHOOK_SECRET',
    'NEXT_PUBLIC_POLAR_LANDLORD_STARTER_ID',
    'NEXT_PUBLIC_POLAR_LANDLORD_GROWTH_ID',
    'NEXT_PUBLIC_POLAR_LANDLORD_PRO_ID',
  ]
  const resendKeys = ['RESEND_API_KEY', 'RESEND_FROM']
  const twilioKeys = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER']
  const openAiKeys = ['OPENAI_API_KEY']

  return [
    {
      id: 'stripe',
      label: 'Stripe rent collection',
      category: 'live',
      health: healthFromKeys(env, stripeKeys),
      summary: 'Connect accounts, ACH setup, subscriptions, and rent webhooks.',
      envKeys: stripeKeys,
    },
    {
      id: 'polar',
      label: 'Polar SaaS billing',
      category: 'live',
      health: healthFromKeys(env, polarKeys),
      summary: 'LandlordOS subscription plans and billing webhooks.',
      envKeys: polarKeys,
    },
    {
      id: 'resend',
      label: 'Resend email',
      category: 'live',
      health: healthFromKeys(env, resendKeys),
      summary: 'Receipts, reminders, maintenance updates, and portfolio email flows.',
      envKeys: resendKeys,
    },
    {
      id: 'twilio',
      label: 'Twilio SMS',
      category: 'live',
      health: healthFromKeys(env, twilioKeys),
      summary: 'Optional SMS reminders, late-rent alerts, and maintenance updates.',
      envKeys: twilioKeys,
    },
    {
      id: 'openai',
      label: 'OpenAI judgment layer',
      category: 'live',
      health: healthFromKeys(env, openAiKeys),
      summary: 'Upgrade rule-based AI endpoints into real LLM-backed triage and drafting.',
      envKeys: openAiKeys,
    },
    {
      id: 'screening',
      label: 'Screening providers',
      category: 'roadmap',
      health: 'planned',
      summary: 'Checkr or SmartMove for credit and background data.',
      envKeys: [],
    },
    {
      id: 'esign',
      label: 'E-sign',
      category: 'roadmap',
      health: 'planned',
      summary: 'DocuSign or Dropbox Sign for lease execution tracking.',
      envKeys: [],
    },
    {
      id: 'accounting',
      label: 'Accounting sync',
      category: 'roadmap',
      health: 'planned',
      summary: 'QuickBooks or Xero sync for bookkeeping and exports.',
      envKeys: [],
    },
    {
      id: 'listings',
      label: 'Listing syndication',
      category: 'roadmap',
      health: 'planned',
      summary: 'Vacancy distribution to marketplaces such as Zillow Rental Manager.',
      envKeys: [],
    },
    {
      id: 'dispatch',
      label: 'Contractor dispatch',
      category: 'roadmap',
      health: 'planned',
      summary: 'Vendor quotes and dispatch from maintenance workflows.',
      envKeys: [],
    },
  ]
}
