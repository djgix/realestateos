export function logCron(job: string, payload: Record<string, unknown>) {
  console.log(JSON.stringify({ source: 'cron', job, ...payload, at: new Date().toISOString() }))
}

export function logWebhook(provider: string, eventType: string, payload: Record<string, unknown>) {
  console.log(JSON.stringify({ source: 'webhook', provider, eventType, ...payload, at: new Date().toISOString() }))
}
