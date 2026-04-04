import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)

export const formatDate = (d: string | Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(d))

export const formatShortDate = (d: string | Date) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(d))

export const getDaysUntil = (d: string | Date) =>
  Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)

export const getInitials = (name: string) =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

export const toCents = (dollars: number) => Math.round(dollars * 100)
export const toDollars = (cents: number) => cents / 100

export const US_STATES = [
  { code:'AL',name:'Alabama' },{ code:'AK',name:'Alaska' },{ code:'AZ',name:'Arizona' },
  { code:'AR',name:'Arkansas' },{ code:'CA',name:'California' },{ code:'CO',name:'Colorado' },
  { code:'CT',name:'Connecticut' },{ code:'DE',name:'Delaware' },{ code:'FL',name:'Florida' },
  { code:'GA',name:'Georgia' },{ code:'HI',name:'Hawaii' },{ code:'ID',name:'Idaho' },
  { code:'IL',name:'Illinois' },{ code:'IN',name:'Indiana' },{ code:'IA',name:'Iowa' },
  { code:'KS',name:'Kansas' },{ code:'KY',name:'Kentucky' },{ code:'LA',name:'Louisiana' },
  { code:'ME',name:'Maine' },{ code:'MD',name:'Maryland' },{ code:'MA',name:'Massachusetts' },
  { code:'MI',name:'Michigan' },{ code:'MN',name:'Minnesota' },{ code:'MS',name:'Mississippi' },
  { code:'MO',name:'Missouri' },{ code:'MT',name:'Montana' },{ code:'NE',name:'Nebraska' },
  { code:'NV',name:'Nevada' },{ code:'NH',name:'New Hampshire' },{ code:'NJ',name:'New Jersey' },
  { code:'NM',name:'New Mexico' },{ code:'NY',name:'New York' },{ code:'NC',name:'North Carolina' },
  { code:'ND',name:'North Dakota' },{ code:'OH',name:'Ohio' },{ code:'OK',name:'Oklahoma' },
  { code:'OR',name:'Oregon' },{ code:'PA',name:'Pennsylvania' },{ code:'RI',name:'Rhode Island' },
  { code:'SC',name:'South Carolina' },{ code:'SD',name:'South Dakota' },{ code:'TN',name:'Tennessee' },
  { code:'TX',name:'Texas' },{ code:'UT',name:'Utah' },{ code:'VT',name:'Vermont' },
  { code:'VA',name:'Virginia' },{ code:'WA',name:'Washington' },{ code:'WV',name:'West Virginia' },
  { code:'WI',name:'Wisconsin' },{ code:'WY',name:'Wyoming' },
]

export const STATE_LAWS: Record<string, {
  noticePay: string; noticeVacate: string; depositMax: string;
  depositReturn: string; entryNotice: string; rentControl: boolean; lateFeeMax: string
}> = {
  CA:{ noticePay:'3 days', noticeVacate:'30/60 days', depositMax:'2 months', depositReturn:'21 days', entryNotice:'24 hours', rentControl:true, lateFeeMax:'5–8%' },
  NY:{ noticePay:'14 days', noticeVacate:'30 days', depositMax:'1 month', depositReturn:'14 days', entryNotice:'Reasonable', rentControl:true, lateFeeMax:'$50 or 5%' },
  TX:{ noticePay:'3 days', noticeVacate:'30 days', depositMax:'No limit', depositReturn:'30 days', entryNotice:'Reasonable', rentControl:false, lateFeeMax:'12%' },
  FL:{ noticePay:'3 days', noticeVacate:'15 days', depositMax:'No limit', depositReturn:'15–60 days', entryNotice:'12 hours', rentControl:false, lateFeeMax:'No limit' },
  IL:{ noticePay:'5 days', noticeVacate:'30 days', depositMax:'No limit', depositReturn:'30 days', entryNotice:'24 hours', rentControl:true, lateFeeMax:'No limit' },
  WA:{ noticePay:'3 days', noticeVacate:'20 days', depositMax:'No limit', depositReturn:'21 days', entryNotice:'2 days', rentControl:false, lateFeeMax:'No limit' },
  CO:{ noticePay:'10 days', noticeVacate:'91 days', depositMax:'No limit', depositReturn:'30 days', entryNotice:'24 hours', rentControl:false, lateFeeMax:'No limit' },
  GA:{ noticePay:'7 days', noticeVacate:'60 days', depositMax:'No limit', depositReturn:'30 days', entryNotice:'Reasonable', rentControl:false, lateFeeMax:'No limit' },
  AZ:{ noticePay:'5 days', noticeVacate:'30 days', depositMax:'1.5 months', depositReturn:'14 days', entryNotice:'2 days', rentControl:false, lateFeeMax:'No limit' },
  NC:{ noticePay:'10 days', noticeVacate:'7 days', depositMax:'2 months', depositReturn:'30 days', entryNotice:'Reasonable', rentControl:false, lateFeeMax:'$15 or 5%' },
  OH:{ noticePay:'3 days', noticeVacate:'30 days', depositMax:'No limit', depositReturn:'30 days', entryNotice:'24 hours', rentControl:false, lateFeeMax:'No limit' },
  MI:{ noticePay:'7 days', noticeVacate:'30 days', depositMax:'1.5 months', depositReturn:'30 days', entryNotice:'24 hours', rentControl:false, lateFeeMax:'No limit' },
  PA:{ noticePay:'10 days', noticeVacate:'15 days', depositMax:'2 months', depositReturn:'30 days', entryNotice:'Reasonable', rentControl:false, lateFeeMax:'No limit' },
}

export const EXPENSE_CATEGORIES = [
  { value:'mortgage', label:'Mortgage', deductible:true },
  { value:'insurance', label:'Insurance', deductible:true },
  { value:'taxes', label:'Property Taxes', deductible:true },
  { value:'repairs', label:'Repairs', deductible:true },
  { value:'maintenance', label:'Maintenance', deductible:true },
  { value:'utilities', label:'Utilities', deductible:true },
  { value:'management', label:'Management Fees', deductible:true },
  { value:'legal', label:'Legal & Professional', deductible:true },
  { value:'marketing', label:'Marketing', deductible:true },
  { value:'supplies', label:'Supplies', deductible:true },
  { value:'travel', label:'Travel', deductible:true },
  { value:'other', label:'Other', deductible:false },
]

export const PRIORITY_CONFIG = {
  emergency: { label:'Emergency', color:'text-red-400 bg-red-400/10 border-red-400/20' },
  high:      { label:'High',      color:'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  normal:    { label:'Normal',    color:'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  low:       { label:'Low',       color:'text-slate-400 bg-slate-400/10 border-slate-400/20' },
}

export const STATUS_CONFIG = {
  active:      { label:'Active',      color:'bg-green-400/10 text-green-400' },
  paid:        { label:'Paid',        color:'bg-green-400/10 text-green-400' },
  pending:     { label:'Pending',     color:'bg-yellow-400/10 text-yellow-400' },
  late:        { label:'Late',        color:'bg-red-400/10 text-red-400' },
  open:        { label:'Open',        color:'bg-orange-400/10 text-orange-400' },
  in_progress: { label:'In Progress', color:'bg-blue-400/10 text-blue-400' },
  completed:   { label:'Completed',   color:'bg-green-400/10 text-green-400' },
  draft:       { label:'Draft',       color:'bg-slate-700 text-slate-400' },
  applicant:   { label:'Applicant',   color:'bg-yellow-400/10 text-yellow-400' },
  past:        { label:'Past',        color:'bg-slate-700 text-slate-400' },
  evicted:     { label:'Evicted',     color:'bg-red-400/10 text-red-400' },
}
