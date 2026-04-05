import type { SupabaseClient } from '@supabase/supabase-js'

export type AutomationEventInsert = {
  owner_id: string
  kind: string
  dedupe_key: string
  channel: 'email' | 'sms' | 'both' | 'system'
  summary: string
  metadata?: Record<string, unknown>
}

export async function insertAutomationEvent(
  client: SupabaseClient,
  row: AutomationEventInsert
) {
  const { error } = await client.from('automation_events').insert({
    owner_id: row.owner_id,
    kind: row.kind,
    dedupe_key: row.dedupe_key,
    channel: row.channel,
    summary: row.summary,
    metadata: row.metadata ?? {},
  })

  if (error?.code === '23505') {
    return { inserted: false, duplicate: true as const }
  }

  if (error) {
    console.error('[automation_events] insert', error)
    return { inserted: false, duplicate: false as const, error }
  }

  return { inserted: true, duplicate: false as const }
}
