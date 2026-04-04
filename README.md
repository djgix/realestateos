# REALESTATEos — Setup Guide

Three complete real estate products: LandlordOS · SellerOS · BuyerOS

## Step 1 — Install Node.js
nodejs.org → LTS → install → verify with `node --version`

## Step 2 — Install dependencies
```bash
cd ~/Desktop/realestateos && npm install
```

## Step 3 — Supabase setup
1. supabase.com → New Project → "realestateos"
2. SQL Editor → paste supabase/schema.sql → Run
3. Settings → API → copy URL and anon key

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
- **Polar** (polar.sh) — create products, add IDs to .env.local, add webhook /api/webhooks/polar
- **Stripe** (stripe.com) — enable Connect, add keys, add webhook /api/webhooks/stripe
- **Resend** (resend.com) — create API key, verify domain
- **PostHog** (posthog.com) — copy project key

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
