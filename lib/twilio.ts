export type SendSmsResult =
  | { sent: true }
  | { sent: false; skipped: 'missing_env' }
  | { sent: false; error: string }

export async function sendSms({ to, body }: { to: string; body: string }): Promise<SendSmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_FROM_NUMBER
  if (!sid || !token || !from) {
    return { sent: false, skipped: 'missing_env' }
  }
  try {
    const twilio = (await import('twilio')).default
    const client = twilio(sid, token)
    await client.messages.create({ from, to, body: body.slice(0, 1600) })
    return { sent: true }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[twilio]', msg)
    return { sent: false, error: msg }
  }
}
