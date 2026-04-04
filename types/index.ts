export type Product = 'none' | 'landlord' | 'seller' | 'buyer' | 'bundle'
export type Plan = 'trial' | 'starter' | 'growth' | 'pro' | 'paid'
export type PropertyType = 'single_family' | 'multi_unit' | 'condo' | 'townhouse' | 'commercial'
export type TenantStatus = 'applicant' | 'active' | 'past' | 'evicted'
export type LeaseStatus = 'draft' | 'sent' | 'active' | 'expired' | 'terminated'
export type PaymentStatus = 'pending' | 'paid' | 'late' | 'partial' | 'failed'
export type MaintenancePriority = 'emergency' | 'high' | 'normal' | 'low'
export type MaintenanceStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'
export type SellerStatus = 'prep' | 'active' | 'under_contract' | 'sold' | 'cancelled'
export type BuyerStatus = 'researching' | 'offer_made' | 'under_contract' | 'closed' | 'passed'
export type StripeAccountStatus = 'not_connected' | 'pending' | 'active'

export interface Profile {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  avatar_url: string | null
  product: Product
  plan: Plan
  trial_ends_at: string
  polar_customer_id: string | null
  stripe_account_id: string | null
  stripe_account_status: StripeAccountStatus
  onboarded: boolean
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  owner_id: string
  name: string
  address: string
  city: string
  state: string
  zip: string
  type: PropertyType
  units: number
  purchase_price: number | null
  current_value: number | null
  mortgage_balance: number | null
  monthly_mortgage: number | null
  year_built: number | null
  square_feet: number | null
  bedrooms: number | null
  bathrooms: number | null
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  owner_id: string
  property_id: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  monthly_income: number | null
  background_check_status: 'not_run' | 'pending' | 'passed' | 'failed'
  credit_score: number | null
  status: TenantStatus
  move_in_date: string | null
  move_out_date: string | null
  stripe_customer_id: string | null
  portal_access: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Lease {
  id: string
  owner_id: string
  property_id: string
  tenant_id: string
  start_date: string
  end_date: string
  monthly_rent: number
  security_deposit: number
  late_fee: number
  late_fee_days: number
  rent_due_day: number
  lease_type: 'fixed' | 'month_to_month'
  status: LeaseStatus
  state: string
  signed_by_tenant: boolean
  signed_by_landlord: boolean
  signed_at: string | null
  stripe_subscription_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface RentPayment {
  id: string
  owner_id: string
  property_id: string
  tenant_id: string
  lease_id: string | null
  amount: number
  late_fee: number
  total_amount: number
  due_date: string
  paid_date: string | null
  status: PaymentStatus
  payment_method: string | null
  stripe_payment_intent_id: string | null
  stripe_transfer_id: string | null
  platform_fee: number
  notes: string | null
  created_at: string
}

export interface MaintenanceRequest {
  id: string
  owner_id: string
  property_id: string
  tenant_id: string | null
  title: string
  description: string
  category: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  photos: string[]
  estimated_cost: number | null
  actual_cost: number | null
  contractor_name: string | null
  contractor_phone: string | null
  scheduled_date: string | null
  completed_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Expense {
  id: string
  owner_id: string
  property_id: string
  category: string
  amount: number
  date: string
  description: string
  vendor: string | null
  receipt_url: string | null
  tax_deductible: boolean
  notes: string | null
  created_at: string
}

export interface SellerListing {
  id: string
  owner_id: string
  address: string
  city: string
  state: string
  zip: string
  asking_price: number
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  year_built: number | null
  property_type: string | null
  description: string | null
  photos: string[]
  status: SellerStatus
  listed_date: string | null
  accepted_offer_amount: number | null
  closing_date: string | null
  agent_commission_saved: number | null
  current_step: string
  steps_completed: string[]
  created_at: string
  updated_at: string
}

export interface SellerOffer {
  id: string
  listing_id: string
  owner_id: string
  buyer_name: string
  buyer_email: string | null
  offer_amount: number
  earnest_money: number | null
  financing_type: string | null
  down_payment_percent: number | null
  contingencies: string[]
  closing_date_requested: string | null
  inspection_period: number
  status: 'received' | 'countered' | 'accepted' | 'rejected' | 'expired'
  counter_amount: number | null
  notes: string | null
  received_at: string
  responded_at: string | null
  created_at: string
}

export interface BuyerSearch {
  id: string
  owner_id: string
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  asking_price: number | null
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  year_built: number | null
  status: BuyerStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BuyerOffer {
  id: string
  search_id: string
  owner_id: string
  offer_amount: number
  earnest_money: number | null
  down_payment_percent: number | null
  financing_type: string | null
  contingencies: string[]
  closing_date_requested: string | null
  inspection_period: number
  escalation_clause: boolean
  escalation_cap: number | null
  cover_letter: string | null
  status: 'draft' | 'submitted' | 'accepted' | 'countered' | 'rejected'
  counter_amount: number | null
  document_url: string | null
  created_at: string
  updated_at: string
}

export interface ChecklistItem {
  id: string
  search_id: string
  owner_id: string
  phase: 'pre_offer' | 'under_contract' | 'closing' | 'post_closing'
  task: string
  description: string | null
  due_date: string | null
  completed: boolean
  completed_at: string | null
  created_at: string
}
