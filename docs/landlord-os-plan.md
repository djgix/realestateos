# Landlord OS Plan and Backlog

_Last reviewed against this branch on April 5, 2026._

## North Star

The system runs the portfolio. The landlord approves exceptions and reads summaries.

Design test for every feature:

- Does the landlord have to do something?
- Or do they only get notified or approve an exception?

If the landlord is still acting like a day-to-day property manager, the feature is not finished yet.

## Status Legend

- `done`: verified in this branch and already wired into a real route, page, or background flow
- `partial`: real code exists, but it is still thin, manual in places, or missing end-to-end product polish
- `future`: mostly not production-wired yet
- `decision`: needs an explicit product call, not just more code

## Repo Reality Check

Verified implementation anchors:

- Automation spine: [`app/api/cron/daily/route.ts`](../app/api/cron/daily/route.ts), [`lib/cron/run-daily.ts`](../lib/cron/run-daily.ts)
- Preferences and settings UI: [`lib/landlord-preferences.ts`](../lib/landlord-preferences.ts), [`app/api/settings/landlord/route.ts`](../app/api/settings/landlord/route.ts), [`app/landlord/settings/LandlordSettingsClient.tsx`](../app/landlord/settings/LandlordSettingsClient.tsx)
- Dashboard and collections activity feed: [`app/landlord/dashboard/page.tsx`](../app/landlord/dashboard/page.tsx), [`app/landlord/finances/collections/page.tsx`](../app/landlord/finances/collections/page.tsx)
- Tenant payment setup: [`app/api/tenants/[id]/stripe-customer/route.ts`](../app/api/tenants/[id]/stripe-customer/route.ts), [`app/api/tenants/[id]/setup-intent/route.ts`](../app/api/tenants/[id]/setup-intent/route.ts), [`app/landlord/tenants/[id]/TenantPaymentActions.tsx`](../app/landlord/tenants/[id]/TenantPaymentActions.tsx)
- Lease subscription start: [`app/api/leases/[id]/start-subscription/route.ts`](../app/api/leases/[id]/start-subscription/route.ts), [`app/landlord/leases/[id]/LeaseActions.tsx`](../app/landlord/leases/[id]/LeaseActions.tsx)
- Stripe webhook rent handling: [`app/api/webhooks/stripe/route.ts`](../app/api/webhooks/stripe/route.ts)
- Maintenance updates: [`app/api/maintenance/[id]/route.ts`](../app/api/maintenance/[id]/route.ts)
- Guided flows scaffold: [`app/landlord/guided-flows/page.tsx`](../app/landlord/guided-flows/page.tsx), [`app/landlord/guided-flows/GuidedFlowCreate.tsx`](../app/landlord/guided-flows/GuidedFlowCreate.tsx), [`supabase/schema.sql`](../supabase/schema.sql)
- Export and trust surface: [`app/api/export/landlord/route.ts`](../app/api/export/landlord/route.ts)
- AI prototype endpoints: [`app/api/ai/maintenance-triage/route.ts`](../app/api/ai/maintenance-triage/route.ts), [`app/api/ai/screening-summary/route.ts`](../app/api/ai/screening-summary/route.ts), [`app/api/ai/collections-draft/route.ts`](../app/api/ai/collections-draft/route.ts), [`app/api/ai/lease-hints/route.ts`](../app/api/ai/lease-hints/route.ts)

## What Is Actually Automated Today

### `done`

- Stripe webhooks update rent payment state on `payment_intent` and `invoice` events, and send receipts where the email path is wired.
- Polar webhooks handle landlord SaaS subscription updates and downgrade/revert flows.
- Supabase triggers create profiles on signup and maintain `updated_at` across core tables.
- Daily cron creates monthly rent rows, marks overdue pending rows as late, sends rent reminders, sends lease expiry notices, sends landlord late-rent alerts, sends tenant collections emails, and logs `automation_events`.
- Landlord preferences are persisted and already drive reminder windows, collections thresholds, timezone handling, and quiet hours.
- Quiet hours already exist in schema-backed preferences and are enforced in cron and maintenance update notifications.
- Maintenance status and schedule changes can notify tenants by email and optional SMS.
- Tenant Stripe customer creation and SetupIntent generation are already exposed in the app.
- Portfolio export already includes automation events and landlord preference snapshot data.
- Schedule E maps ledger data into IRS-style lines on load; depreciation is still placeholder logic.

### `partial`

- Collections autopilot is real, but the product model is still narrower than a full PM collections program.
- Recurring rent via Stripe subscription exists, but it still needs money-path verification and sharper UX around tenant mandate completion and failure handling.
- Guided flows are no longer schema-only; they have a table, page, create flow, and legal-center handoff, but they are still scaffold-level.
- Integrations status exists, but it is mostly an honest Twilio env check plus placeholder copy.
- AI exists as rule-based or heuristic endpoints, but not yet as deeply integrated judgment automation.
- Observability exists as structured console logs for cron and webhooks, but not as a mature alerting or testing system.

### `future`

- State-aware collections notices, pay-or-quit generation, and eviction packet prep
- Full screening integrations such as Checkr or SmartMove
- E-sign execution tracking
- Contractor marketplace dispatch
- Listing syndication
- Accounting sync
- Rent comps and pricing automation

## Honest Product Assessment

The app is no longer just a mock. Tier 1 wiring is materially present in this branch.

The current gap is not "nothing is automated." The current gap is that many workflows are still first-pass versions:

- they rely on heuristic steps instead of explicit policy models
- they are missing end-to-end verification
- they are not yet integrated tightly enough to replace a strong third-party PM company

That framing matters for prioritization. The next wins are about reliability and trust, not just adding more surfaces.

## Priority Backlog

### Tier 1 alignment

| ID | Status | Why it matters | Next acceptance bar |
| --- | --- | --- | --- |
| `lo-prefs-collections-align` | `partial` | The UI uses landlord prefs, and cron uses prefs too, but cron still interpolates a fixed 4-step ladder between soft and hard thresholds. The product should either expose exact ladder steps or clearly present the current model. | Collections settings, cron behavior, dashboard copy, and legal links all describe the same ladder. No mismatch between "soft/hard bucket" language and actual send days. |
| `lo-settings-url-ops` | `done` | Settings tabs already deep-link with `?tab=` and operations fields already exist for reminder lead, timezone, quiet hours, and collections thresholds. | Retire this todo unless a new scope is introduced. |
| `lo-quiet-hours` | `done` | Quiet hours are already in `landlord_preferences` and enforced in cron plus maintenance notifications. | Retire this todo unless receipts should also honor quiet hours. |
| `lo-maintenance-loop` | `partial` | Tenant update notifications exist, but the full loop still lacks landlord summarying, contractor dispatch, and richer audit history. | Every maintenance status change leaves an audit trail, notifies the right party, and can hand off to contractor dispatch without manual copy-paste. |
| `lo-export-trust` | `done` | Export already includes events plus landlord snapshot data. | Retire this todo as written. If needed, open a new trust item for restore/import or export verification UX. |
| `lo-tests-observability` | `partial` | Structured logging exists, but there are effectively no automated tests for the new automation paths. | Add targeted tests for prefs parsing, quiet-hours logic, collections thresholds, cron idempotency, and Stripe webhook invoice flows. Add basic production alerting or failure counters beyond console logs. |

### Tier 2 money

| ID | Status | Why it matters | Next acceptance bar |
| --- | --- | --- | --- |
| `lo-money-verify` | `partial` | Stripe customer creation, SetupIntent creation, subscription start, and invoice webhooks are all present, but this is the part of the product that most needs proof instead of intent. | Landlord can activate a lease, tenant can add a bank account, recurring rent bills on schedule, webhook events produce correct rent rows, and failure states show up clearly in collections and dashboard surfaces. |

### Tier 3 AI

These are better described as "prototype exists" rather than "future from zero."

| ID | Status | Why it matters | Next acceptance bar |
| --- | --- | --- | --- |
| `lo-tier3-maintenance-triage` | `partial` | There is already a rule-based maintenance triage endpoint, but it is not yet a dispatch workflow. | Maintenance intake can classify severity, recommend trade, request approval when needed, and create a contractor-ready dispatch message with audit trail. |
| `lo-tier3-screening-ai` | `partial` | There is already a plain-English screening summary endpoint over stored fields, but no production integration with real screening providers. | Real screening data lands in the system, AI summarizes it, and landlord sees a reviewable approve/review/decline recommendation with source facts. |
| `lo-tier3-collections-ladder` | `partial` | There is already a heuristic collections draft endpoint and cron ladder, but no state-aware legal escalation workflow. | Day-based collections stages are state-aware, reviewable by the landlord, and generate draft notices plus downstream legal tasks. |
| `lo-tier3-lease-ai` | `partial` | There is already a lease-hints endpoint, but not full drafting, clause generation, or enforceability review. | Lease generation can add custom clauses, surface state cautions, and produce a tenant-readable summary before signature. |

### Tier 4 integrations

| ID | Status | Why it matters | Next acceptance bar |
| --- | --- | --- | --- |
| `lo-integrations-stub` | `partial` | The integrations tab is honest today, which is good, but only Twilio has env-status awareness. | Show configured vs missing state for each planned integration and separate "available now" from "roadmap." |
| `lo-tier4-integrations` | `future` | This is how Landlord OS replaces adjacent PM tools instead of becoming a narrow app with many tabs. | Pick one integration category at a time and ship it end to end, starting with the one that best compounds existing workflows. |

## Recommended Execution Order

1. Finish Tier 1 alignment.
2. Prove Tier 2 money works end to end.
3. Add trust through tests and observability.
4. Pick one Tier 3 vertical before broad Tier 4 expansion.

Why this order:

- Tier 1 and Tier 2 increase "the system runs the portfolio" immediately.
- Trust work reduces regression risk before more automation lands.
- A single strong AI vertical will differentiate the product more than many shallow integrations.

## Guided Flows Decision

`guided_flows` should no longer be described as "schema may still lack product wiring."

Current reality:

- the schema exists
- CRUD scaffolding exists
- the landlord-facing page exists
- the legal center can receive a flow handoff

The real decision is now product shape:

- Wire guided flows into legal and onboarding workflows as a first-class operating system surface.
- Or explicitly deprecate and remove them before more workflow logic accumulates around them.

Recommended todo rename:

- Replace `lo-guided-flows-product` with `lo-guided-flows-decision`

## Repo-Wide Unfinished Audit

This repo also has non-Landlord gaps that should be tracked explicitly.

### Shared and navigation gaps

| ID | Status | Why it matters | Evidence |
| --- | --- | --- | --- |
| `repo-landing-footer-legal` | `done` | The landing page footer now points to real Privacy and Terms pages instead of dead anchors. | [`app/page.tsx`](../app/page.tsx), [`app/privacy/page.tsx`](../app/privacy/page.tsx), [`app/terms/page.tsx`](../app/terms/page.tsx) |

### Landlord gaps outside the core automation backlog

| ID | Status | Why it matters | Evidence |
| --- | --- | --- | --- |
| `repo-landlord-messages-routes` | `partial` | The broken routes have now been filled in with basic new-thread, broadcast, and conversation pages, but messaging is still lightweight and not yet a full communications center. | [`app/landlord/messages/page.tsx`](../app/landlord/messages/page.tsx), [`app/landlord/messages/new/page.tsx`](../app/landlord/messages/new/page.tsx), [`app/landlord/messages/broadcast/page.tsx`](../app/landlord/messages/broadcast/page.tsx), [`app/landlord/messages/[tenantId]/page.tsx`](../app/landlord/messages/[tenantId]/page.tsx) |
| `repo-landlord-edit-routes` | `future` | Tenant and property detail pages link to edit routes that do not exist, which creates dead-end UX on important records. | [`app/landlord/tenants/[id]/page.tsx`](../app/landlord/tenants/[id]/page.tsx), [`app/landlord/properties/[id]/page.tsx`](../app/landlord/properties/[id]/page.tsx) |
| `repo-landlord-vacancy-ats-mock` | `done` | The fake applicant and broken `mock_applicant` lease path have been replaced with an honest manual-workflow vacancy state. | [`app/landlord/properties/[id]/page.tsx`](../app/landlord/properties/[id]/page.tsx) |
| `repo-landlord-notification-toggles` | `partial` | Settings exposes `email_maintenance_new` and `email_lease_signed`, but the labels themselves still mark them as future and there are no corresponding send paths wired yet. | [`lib/landlord-preferences.ts`](../lib/landlord-preferences.ts), [`app/landlord/settings/LandlordSettingsClient.tsx`](../app/landlord/settings/LandlordSettingsClient.tsx) |

### SellerOS gaps

| ID | Status | Why it matters | Evidence |
| --- | --- | --- | --- |
| `repo-seller-offer-actions` | `future` | Seller offers can be recorded, but Accept, Counter, and Reject buttons in the UI do not execute any workflow yet. | [`app/seller/offers/page.tsx`](../app/seller/offers/page.tsx), [`app/api/seller/offers/route.ts`](../app/api/seller/offers/route.ts) |
| `repo-seller-documents-generator` | `future` | The documents page is mostly a static catalog; “Generate” is a timeout-based placeholder and “Download” is not backed by persisted files. | [`app/seller/documents/page.tsx`](../app/seller/documents/page.tsx) |
| `repo-seller-closing-checklist-state` | `future` | The closing checklist is rendered from static arrays with no saved completion state, so it behaves like reference content rather than an operating workflow. | [`app/seller/closing/page.tsx`](../app/seller/closing/page.tsx) |

### BuyerOS note

BuyerOS looks more internally consistent than SellerOS in this sweep, but it still reads more like guided content plus tracked properties than a deeply automated workflow. It likely needs a separate operating-model pass after LandlordOS and SellerOS stabilize.

## Product Principle for Future Work

For every backlog item, ask:

- Does this reduce landlord clicks?
- Does this move work into automation?
- Does this reserve landlord attention for approval, exception handling, or summary review?

If the answer is no, it is probably UI expansion, not Landlord OS progress.
