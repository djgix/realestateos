-- REALESTATEos Complete Database Schema
-- Run this entire file in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- ─── PROFILES ─────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text unique not null,
  phone text,
  avatar_url text,
  product text default 'none' check (product in ('none','landlord','seller','buyer','bundle')),
  plan text default 'trial' check (plan in ('trial','starter','growth','pro','paid')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  polar_customer_id text,
  stripe_account_id text,        -- Stripe Connect for landlords receiving rent
  stripe_account_status text default 'not_connected' check (stripe_account_status in ('not_connected','pending','active')),
  onboarded boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── PROPERTIES ───────────────────────────────────────────────────────
create table public.properties (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  type text default 'single_family' check (type in ('single_family','multi_unit','condo','townhouse','commercial')),
  units integer default 1,
  purchase_price numeric,
  current_value numeric,
  mortgage_balance numeric,
  monthly_mortgage numeric,
  year_built integer,
  square_feet integer,
  bedrooms integer,
  bathrooms numeric,
  photo_url text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── TENANTS ──────────────────────────────────────────────────────────
create table public.tenants (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  emergency_contact_name text,
  emergency_contact_phone text,
  monthly_income numeric,
  background_check_status text default 'not_run' check (background_check_status in ('not_run','pending','passed','failed')),
  credit_score integer,
  status text default 'applicant' check (status in ('applicant','active','past','evicted')),
  move_in_date date,
  move_out_date date,
  stripe_customer_id text,       -- Stripe customer for ACH rent payments
  portal_access boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── LEASES ───────────────────────────────────────────────────────────
create table public.leases (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  start_date date not null,
  end_date date not null,
  monthly_rent numeric not null,
  security_deposit numeric not null,
  late_fee numeric default 50,
  late_fee_days integer default 5,
  rent_due_day integer default 1,
  lease_type text default 'fixed' check (lease_type in ('fixed','month_to_month')),
  status text default 'draft' check (status in ('draft','sent','active','expired','terminated')),
  state text not null,
  signed_by_tenant boolean default false,
  signed_by_landlord boolean default false,
  signed_at timestamptz,
  stripe_subscription_id text,   -- Stripe recurring rent subscription
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── RENT PAYMENTS ────────────────────────────────────────────────────
create table public.rent_payments (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  lease_id uuid references public.leases(id) on delete set null,
  amount numeric not null,
  late_fee numeric default 0,
  total_amount numeric not null,
  due_date date not null,
  paid_date timestamptz,
  status text default 'pending' check (status in ('pending','paid','late','partial','failed','cancelled')),
  payment_method text check (payment_method in ('ach','card','cash','check','zelle','venmo','other')),
  stripe_payment_intent_id text,
  stripe_transfer_id text,       -- Transfer to landlord's Connect account
  platform_fee numeric default 0, -- Our cut (optional)
  notes text,
  created_at timestamptz default now()
);

-- ─── MAINTENANCE ──────────────────────────────────────────────────────
create table public.maintenance_requests (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  tenant_id uuid references public.tenants(id) on delete set null,
  title text not null,
  description text not null,
  category text check (category in ('plumbing','electrical','hvac','appliance','structural','pest','landscaping','other')),
  priority text default 'normal' check (priority in ('emergency','high','normal','low')),
  status text default 'open' check (status in ('open','in_progress','completed','cancelled')),
  photos text[],
  estimated_cost numeric,
  actual_cost numeric,
  contractor_name text,
  contractor_phone text,
  scheduled_date timestamptz,
  completed_date timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── EXPENSES ─────────────────────────────────────────────────────────
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete cascade not null,
  category text not null check (category in ('mortgage','insurance','taxes','repairs','maintenance','utilities','management','legal','marketing','supplies','travel','other')),
  amount numeric not null,
  date date not null,
  description text not null,
  vendor text,
  receipt_url text,
  tax_deductible boolean default true,
  notes text,
  created_at timestamptz default now()
);

-- ─── MESSAGES ─────────────────────────────────────────────────────────
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete set null,
  sender text not null check (sender in ('owner','tenant')),
  subject text,
  body text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ─── DOCUMENTS ────────────────────────────────────────────────────────
create table public.documents (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  lease_id uuid references public.leases(id) on delete set null,
  name text not null,
  type text check (type in ('lease','notice','inspection','insurance','tax','deed','disclosure','contract','other')),
  url text not null,
  size integer,
  created_at timestamptz default now()
);

-- ─── EASY BUTTON FLOWS ────────────────────────────────────────────────
create table public.guided_flows (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  property_id uuid references public.properties(id) on delete set null,
  tenant_id uuid references public.tenants(id) on delete set null,
  type text not null check (type in ('eviction','non_payment','lease_violation','lease_expiry','early_termination','property_damage','entry_notice','rent_increase','move_out','tax_time')),
  status text default 'in_progress' check (status in ('in_progress','completed','cancelled')),
  current_step integer default 1,
  total_steps integer not null,
  data jsonb default '{}',       -- Stores answers to guided questions
  documents_generated text[],
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── SELLER OS ────────────────────────────────────────────────────────
create table public.seller_listings (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  asking_price numeric not null,
  bedrooms integer,
  bathrooms numeric,
  square_feet integer,
  year_built integer,
  property_type text check (property_type in ('single_family','condo','townhouse','multi_unit','land','commercial')),
  description text,
  photos text[],
  status text default 'prep' check (status in ('prep','active','under_contract','sold','cancelled')),
  listed_date date,
  accepted_offer_amount numeric,
  closing_date date,
  agent_commission_saved numeric,
  polar_order_id text,           -- Polar payment for SellerOS
  current_step text default 'prep',
  steps_completed text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.seller_offers (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.seller_listings(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  buyer_name text not null,
  buyer_email text,
  buyer_agent text,
  offer_amount numeric not null,
  earnest_money numeric,
  financing_type text check (financing_type in ('conventional','fha','va','cash','other')),
  down_payment_percent numeric,
  contingencies text[],
  closing_date_requested date,
  inspection_period integer default 10,
  status text default 'received' check (status in ('received','countered','accepted','rejected','expired')),
  counter_amount numeric,
  notes text,
  received_at timestamptz default now(),
  responded_at timestamptz,
  created_at timestamptz default now()
);

create table public.seller_disclosures (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.seller_listings(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  state text not null,
  answers jsonb default '{}',
  completed boolean default false,
  document_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.seller_closing_tasks (
  id uuid default uuid_generate_v4() primary key,
  listing_id uuid references public.seller_listings(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  task text not null,
  category text,
  due_date date,
  completed boolean default false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- ─── BUYER OS ─────────────────────────────────────────────────────────
create table public.buyer_searches (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  address text,
  city text,
  state text,
  zip text,
  asking_price numeric,
  bedrooms integer,
  bathrooms numeric,
  square_feet integer,
  year_built integer,
  status text default 'researching' check (status in ('researching','offer_made','under_contract','closed','passed')),
  notes text,
  polar_order_id text,           -- Polar payment for BuyerOS
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.buyer_offers (
  id uuid default uuid_generate_v4() primary key,
  search_id uuid references public.buyer_searches(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  offer_amount numeric not null,
  earnest_money numeric,
  down_payment_percent numeric,
  financing_type text,
  contingencies text[],
  closing_date_requested date,
  inspection_period integer default 10,
  escalation_clause boolean default false,
  escalation_cap numeric,
  cover_letter text,
  status text default 'draft' check (status in ('draft','submitted','accepted','countered','rejected')),
  counter_amount numeric,
  document_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.buyer_checklist_items (
  id uuid default uuid_generate_v4() primary key,
  search_id uuid references public.buyer_searches(id) on delete cascade not null,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  phase text check (phase in ('pre_offer','under_contract','closing','post_closing')),
  task text not null,
  description text,
  due_date date,
  completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table public.buyer_calculators (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  search_id uuid references public.buyer_searches(id) on delete set null,
  home_price numeric not null,
  down_payment_percent numeric not null,
  interest_rate numeric not null,
  loan_term integer default 30,
  property_tax_annual numeric,
  insurance_annual numeric,
  hoa_monthly numeric default 0,
  pmi_rate numeric,
  closing_cost_percent numeric default 3,
  monthly_payment numeric,
  total_closing_costs numeric,
  created_at timestamptz default now()
);

-- ─── PLATFORM PAYMENTS (Polar webhooks) ───────────────────────────────
create table public.platform_payments (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete set null,
  polar_order_id text unique,
  polar_subscription_id text,
  product text not null,
  plan text,
  amount numeric not null,
  currency text default 'usd',
  status text default 'pending' check (status in ('pending','paid','failed','refunded')),
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.tenants enable row level security;
alter table public.leases enable row level security;
alter table public.rent_payments enable row level security;
alter table public.maintenance_requests enable row level security;
alter table public.expenses enable row level security;
alter table public.messages enable row level security;
alter table public.documents enable row level security;
alter table public.guided_flows enable row level security;
alter table public.seller_listings enable row level security;
alter table public.seller_offers enable row level security;
alter table public.seller_disclosures enable row level security;
alter table public.seller_closing_tasks enable row level security;
alter table public.buyer_searches enable row level security;
alter table public.buyer_offers enable row level security;
alter table public.buyer_checklist_items enable row level security;
alter table public.buyer_calculators enable row level security;
alter table public.platform_payments enable row level security;

-- Policies: owners only see their own data
create policy "own_profile" on public.profiles for all using (auth.uid() = id);
create policy "own_properties" on public.properties for all using (auth.uid() = owner_id);
create policy "own_tenants" on public.tenants for all using (auth.uid() = owner_id);
create policy "own_leases" on public.leases for all using (auth.uid() = owner_id);
create policy "own_payments" on public.rent_payments for all using (auth.uid() = owner_id);
create policy "own_maintenance" on public.maintenance_requests for all using (auth.uid() = owner_id);
create policy "own_expenses" on public.expenses for all using (auth.uid() = owner_id);
create policy "own_messages" on public.messages for all using (auth.uid() = owner_id);
create policy "own_documents" on public.documents for all using (auth.uid() = owner_id);
create policy "own_flows" on public.guided_flows for all using (auth.uid() = owner_id);
create policy "own_listings" on public.seller_listings for all using (auth.uid() = owner_id);
create policy "own_offers" on public.seller_offers for all using (auth.uid() = owner_id);
create policy "own_disclosures" on public.seller_disclosures for all using (auth.uid() = owner_id);
create policy "own_closing_tasks" on public.seller_closing_tasks for all using (auth.uid() = owner_id);
create policy "own_searches" on public.buyer_searches for all using (auth.uid() = owner_id);
create policy "own_buyer_offers" on public.buyer_offers for all using (auth.uid() = owner_id);
create policy "own_checklist" on public.buyer_checklist_items for all using (auth.uid() = owner_id);
create policy "own_calculators" on public.buyer_calculators for all using (auth.uid() = owner_id);
create policy "own_platform_payments" on public.platform_payments for all using (auth.uid() = owner_id);

-- Auto updated_at
create or replace function update_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger trg_profiles before update on public.profiles for each row execute function update_updated_at();
create trigger trg_properties before update on public.properties for each row execute function update_updated_at();
create trigger trg_tenants before update on public.tenants for each row execute function update_updated_at();
create trigger trg_leases before update on public.leases for each row execute function update_updated_at();
create trigger trg_maintenance before update on public.maintenance_requests for each row execute function update_updated_at();
create trigger trg_flows before update on public.guided_flows for each row execute function update_updated_at();
create trigger trg_listings before update on public.seller_listings for each row execute function update_updated_at();
create trigger trg_searches before update on public.buyer_searches for each row execute function update_updated_at();

-- ─── CONTRACTOR DIRECTORY ─────────────────────────────────────────────
create table public.contractor_directory (
  id uuid default uuid_generate_v4() primary key,
  owner_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  category text not null check (category in ('plumbing','electrical','hvac','appliance','structural','pest','landscaping','other')),
  phone text,
  email text,
  notes text,
  preferred boolean default false,
  created_at timestamptz default now()
);

alter table public.contractor_directory enable row level security;
create policy "own_contractors" on public.contractor_directory for all using (auth.uid() = owner_id);

-- ─── NEW COLUMNS (automation features) ───────────────────────────────
-- Tenant portal token (secure unique URL access)
alter table public.tenants add column if not exists portal_token uuid default uuid_generate_v4() unique;

-- Maintenance dispatch tracking
alter table public.maintenance_requests add column if not exists dispatched_at timestamptz;
alter table public.maintenance_requests add column if not exists contractor_email text;
alter table public.maintenance_requests add column if not exists submitted_via text default 'landlord' check (submitted_via in ('landlord','tenant'));

-- Rent payment collections tracking (which rule steps have fired)
alter table public.rent_payments add column if not exists collections_actions_sent text[] default '{}';

-- Collections configuration (JSONB rules per landlord / per property)
alter table public.profiles add column if not exists collections_config jsonb;
alter table public.properties add column if not exists collections_config jsonb;

-- Maintenance approval tracking (SMS YES/NO flow)
alter table public.maintenance_requests add column if not exists landlord_approval_status text
  check (landlord_approval_status in ('pending_sms','approved','declined'));
alter table public.maintenance_requests add column if not exists landlord_notified_at timestamptz;
alter table public.maintenance_requests add column if not exists contractor_name text;
alter table public.maintenance_requests add column if not exists contractor_phone text;

-- Per-landlord settings (notifications, automation, portal, comms, rent defaults, maintenance prefs)
alter table public.profiles add column if not exists notifications_config jsonb;
alter table public.profiles add column if not exists settings jsonb;

-- Tenant portal: ensure portal_access column exists (for global disable)
-- portal_token already added above

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Performance indexes
create index if not exists idx_properties_owner on public.properties(owner_id);
create index if not exists idx_tenants_owner on public.tenants(owner_id);
create index if not exists idx_tenants_portal_token on public.tenants(portal_token);
create index if not exists idx_maintenance_owner on public.maintenance_requests(owner_id);
create index if not exists idx_maintenance_status on public.maintenance_requests(status);
create index if not exists idx_maintenance_approval on public.maintenance_requests(landlord_approval_status);
create index if not exists idx_rent_payments_owner on public.rent_payments(owner_id);
create index if not exists idx_rent_payments_status on public.rent_payments(status);
create index if not exists idx_rent_payments_due_date on public.rent_payments(due_date);
create index if not exists idx_leases_owner on public.leases(owner_id);
create index if not exists idx_messages_owner on public.messages(owner_id);
create index if not exists idx_expenses_owner on public.expenses(owner_id);
