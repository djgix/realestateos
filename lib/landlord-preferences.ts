import { z } from 'zod'

const notificationsSchema = z.object({
  email_late_rent: z.boolean().default(true),
  email_lease_expiry: z.boolean().default(true),
  email_rent_reminder: z.boolean().default(true),
  email_maintenance_new: z.boolean().default(true),
  email_payment_received: z.boolean().default(true),
  email_lease_signed: z.boolean().default(true),
  email_weekly_summary: z.boolean().default(true),
  sms_late_rent: z.boolean().default(false),
  sms_rent_reminder: z.boolean().default(false),
  sms_maintenance_update: z.boolean().default(false),
})

const collectionsSchema = z.object({
  soft_days_late: z.number().min(0).max(30).default(3),
  hard_days_late: z.number().min(0).max(60).default(7),
  tone: z.enum(['friendly', 'neutral', 'firm']).default('friendly'),
})

const automationSchema = z.object({
  rent_reminder_days_before: z.number().min(1).max(14).default(3),
  lease_expiry_notice_days: z.array(z.number()).default([60, 30, 14]),
  timezone: z.string().default('America/Los_Angeles'),
  quiet_hours_enabled: z.boolean().default(false),
  quiet_hours_start: z.string().default('22:00'),
  quiet_hours_end: z.string().default('07:00'),
})

export const landlordPreferencesSchema = z.object({
  notifications: notificationsSchema.default({}),
  automation: automationSchema.default({}),
  collections: collectionsSchema.default({}),
})

export type LandlordPreferences = z.infer<typeof landlordPreferencesSchema>

export function parseLandlordPreferences(raw: unknown): LandlordPreferences {
  const base = typeof raw === 'object' && raw !== null ? raw : {}
  return landlordPreferencesSchema.parse(base)
}

export function mergeLandlordPreferences(
  current: unknown,
  patch: Partial<LandlordPreferences>
): LandlordPreferences {
  const cur = parseLandlordPreferences(current)
  return landlordPreferencesSchema.parse({
    notifications: { ...cur.notifications, ...patch.notifications },
    automation: {
      ...cur.automation,
      ...patch.automation,
      lease_expiry_notice_days:
        patch.automation?.lease_expiry_notice_days ?? cur.automation.lease_expiry_notice_days,
    },
    collections: { ...cur.collections, ...patch.collections },
  })
}
