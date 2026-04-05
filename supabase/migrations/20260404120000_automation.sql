-- Run in Supabase SQL Editor if upgrading an existing project (additive only)

alter table public.profiles add column if not exists landlord_preferences jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists business_address text;

alter table public.tenants add column if not exists email_notifications boolean default true;

create table if not exists public.automation_events (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  kind text not null,
  dedupe_key text not null unique,
  channel text default 'email' check (channel in ('email','sms','both','system')),
  summary text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_automation_events_owner_created on public.automation_events (owner_id, created_at desc);

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  received_at timestamptz default now()
);

create table if not exists public.polar_webhook_events (
  event_id text primary key,
  received_at timestamptz default now()
);

alter table public.automation_events enable row level security;
alter table public.stripe_webhook_events enable row level security;
alter table public.polar_webhook_events enable row level security;

drop policy if exists "own_automation_events_select" on public.automation_events;
create policy "own_automation_events_select" on public.automation_events for select using (auth.uid() = owner_id);
drop policy if exists "own_automation_events_insert" on public.automation_events;
create policy "own_automation_events_insert" on public.automation_events for insert with check (auth.uid() = owner_id);

create index if not exists idx_rent_payments_owner_due on public.rent_payments (owner_id, due_date);
create index if not exists idx_rent_payments_pending_late on public.rent_payments (status, due_date) where status in ('pending','late');
create index if not exists idx_leases_status_end on public.leases (status, end_date);
create index if not exists idx_leases_owner_status on public.leases (owner_id, status);
