# REALESTATEos — Setup Guide

Three complete real estate products: LandlordOS · SellerOS · BuyerOS

## Product planning

- Landlord operating model and verified backlog: [`docs/landlord-os-plan.md`](docs/landlord-os-plan.md)

## Step 1 — Install Node.js
nodejs.org → LTS → install → verify with `node --version`

## Step 2 — Install dependencies
```bash
cd ~/Desktop/realestateos && npm install
```

## Step 3 — Supabase setup
1. supabase.com → New Project → "realestateos"
2. SQL Editor → paste `supabase/schema.sql` → Run (greenfield)
3. **Existing projects:** also run `supabase/migrations/20260404120000_automation.sql` in the SQL editor (or use Supabase CLI) so `landlord_preferences`, `automation_events`, webhook idempotency tables, and indexes exist.
4. Settings → API → copy URL, anon (publishable) key, and **service role** key (server-only)

## Step 4 — Environment
```bash
cp .env.example .env.local
# Fill in your Supabase URL and anon key
```

## Step 5 — Run
```bash
npm run dev
# Open http://localhost:3000
```

## Payment setup (when ready to charge)
- **Polar** (polar.sh) — create products, add IDs to .env.local, add webhook `/api/webhooks/polar`
- **Stripe** (stripe.com) — enable Connect, add keys, add webhook `/api/webhooks/stripe`
- **Resend** (resend.com) — create API key, verify domain
- **PostHog** (posthog.com) — copy project key

## Landlord automation & cron
- Set `CRON_SECRET` to a long random string in Vercel (and locally).
- Vercel deploys with `vercel.json` schedule a daily `GET` to `/api/cron/daily` with `Authorization: Bearer <CRON_SECRET>`.
- **External fallback:** [cron-job.org](https://cron-job.org) (or similar) — same URL, same header, daily UTC.
- Requires `SUPABASE_SERVICE_ROLE_KEY` so the job can read all landlords’ leases and payments (service role is never sent to the browser).

### Smoke checks (manual)
```bash
# Wrong secret → 401
curl -s -o /dev/null -w "%{http_code}" https://YOUR_DOMAIN/api/cron/daily

curl -s -H "Authorization: Bearer $CRON_SECRET" https://YOUR_DOMAIN/api/cron/daily
```

Landlord notification toggles and operations defaults live in **Settings** (`landlord_preferences` on `profiles`). Tenant bank setup links use `TENANT_PORTAL_SECRET` (or `CRON_SECRET` in dev).

### Optional SMS
Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_FROM_NUMBER` when ready; without them, SMS paths no-op.

### Landlord portfolio export
In **Settings → Security**, “Download portfolio JSON” calls `GET /api/export/landlord` (authenticated). The file includes properties, tenants, leases, rent payments, maintenance, expenses, recent `automation_events`, and a small `landlord_snapshot` (preferences + business address). Use it for backups or GDPR-style portability; account deletion is a separate action in the same tab.

## Deploy
1. Push to GitHub
2. Import at vercel.com
3. Add all .env.local vars in Vercel settings
4. Deploy — live in 2 minutes

## Pages built
**LandlordOS:** Dashboard, Easy Buttons (7 guided flows), Properties (list/detail/new), Tenants (list/detail/new), Leases (list/generator), Maintenance (list/new), Finances (P&L/expense/payment), Legal Center (50 states), Messages, Settings

**SellerOS:** Dashboard, Listing (list/new), Documents (disclosure generator), Offers (review/accept/counter), Closing (checklist), Settings

**BuyerOS:** Dashboard, Properties (list/detail/new), Offer Generator, Full Buyer Checklist, Mortgage Calculator, Settings

**Shared:** Landing page with product selector, Auth (login/signup), Sidebar, All API routes, Polar + Stripe webhooks, 8 Resend email templates, Complete Supabase schema, TypeScript types
