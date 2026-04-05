import { formatInTimeZone } from 'date-fns-tz'
import type { LandlordPreferences } from '@/lib/landlord-preferences'

function parseHm(s: string): { h: number; m: number } | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (Number.isNaN(h) || Number.isNaN(min) || h < 0 || h > 23 || min < 0 || min > 59) return null
  return { h, m: min }
}

function toMin(h: number, m: number) {
  return h * 60 + m
}

/** When true, defer optional outbound email/SMS (cron, landlord alerts) until outside the window. */
export function isQuietHoursNow(prefs: LandlordPreferences, now = new Date()): boolean {
  const a = prefs.automation
  if (!a.quiet_hours_enabled) return false
  const start = parseHm(a.quiet_hours_start)
  const end = parseHm(a.quiet_hours_end)
  if (!start || !end) return false
  const tz = a.timezone || 'America/Los_Angeles'
  const hm = formatInTimeZone(now, tz, 'HH:mm')
  const [th, tm] = hm.split(':').map(Number)
  const cur = toMin(th, tm)
  const s = toMin(start.h, start.m)
  const e = toMin(end.h, end.m)
  if (s === e) return false
  if (s < e) return cur >= s && cur < e
  return cur >= s || cur < e
}
