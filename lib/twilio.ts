import Twilio from 'twilio'
import { CONTRACTOR_TYPE } from './utils'

let _client: ReturnType<typeof Twilio> | undefined

function getClient() {
  if (!_client) {
    _client = Twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!)
  }
  return _client
}

export async function sendSMS(to: string, body: string): Promise<void> {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_FROM_NUMBER) {
    console.warn('[Twilio] Skipped — credentials not configured')
    return
  }
  try {
    await getClient().messages.create({ to, from: process.env.TWILIO_FROM_NUMBER, body })
  } catch (err) {
    console.error('[Twilio] Failed to send SMS:', err)
  }
}

export async function notifyLandlordMaintenance(params: {
  landlordPhone: string
  tenantName: string
  address: string
  title: string
  description: string
  category: string
  priority: string
}): Promise<void> {
  const contractorType = CONTRACTOR_TYPE[params.category] || 'Handyman'
  const priorityFlag = params.priority === 'emergency' ? '🚨 EMERGENCY' : params.priority === 'high' ? '⚠️ HIGH' : '📋'

  const body = [
    `🔧 New maintenance request`,
    `📍 ${params.address} — ${params.tenantName}`,
    `${priorityFlag} ${params.title}`,
    `${params.description.slice(0, 100)}${params.description.length > 100 ? '...' : ''}`,
    `💡 Recommended: ${contractorType}`,
    ``,
    `Reply YES to dispatch or NO to skip`,
  ].join('\n')

  await sendSMS(params.landlordPhone, body)
}

export async function notifyContractor(params: {
  contractorPhone?: string
  contractorName: string
  category: string
  address: string
  tenantName: string
  title: string
  description: string
}): Promise<void> {
  if (!params.contractorPhone) return

  const body = [
    `📋 New job request from LandlordOS`,
    `Property: ${params.address}`,
    `Tenant: ${params.tenantName}`,
    `Issue: ${params.title}`,
    `Details: ${params.description.slice(0, 120)}`,
    `Please confirm your availability.`,
  ].join('\n')

  await sendSMS(params.contractorPhone, body)
}

export async function replyToLandlord(landlordPhone: string, body: string): Promise<void> {
  await sendSMS(landlordPhone, body)
}

export function validateTwilioRequest(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!process.env.TWILIO_AUTH_TOKEN) return false
  return Twilio.validateRequest(process.env.TWILIO_AUTH_TOKEN, signature, url, params)
}
