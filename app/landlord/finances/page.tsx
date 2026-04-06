import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, EXPENSE_CATEGORIES } from '@/lib/utils'
import { DollarSign, TrendingUp, TrendingDown, Plus, Receipt, ArrowRight, CreditCard, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Finances | REALESTATEos' }

export default async function FinancesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString()

  const [{ data: payments }, { data: expenses }, { data: profile }] = await Promise.all([
    supabase.from('rent_payments').select('*, tenants(first_name, last_name), properties(name)').eq('owner_id', user!.id).order('due_date', { ascending: false }),
    supabase.from('expenses').select('*, properties(name)').eq('owner_id', user!.id).order('date', { ascending: false }),
    supabase.from('profiles').select('stripe_account_status').eq('id', user!.id).single(),
  ])

  const monthlyIncome = payments?.filter(p => p.status === 'paid' && new Date(p.paid_date) >= new Date(startOfMonth)).reduce((s, p) => s + p.total_amount, 0) || 0
  const monthlyExpenses = expenses?.filter(e => e.date >= startOfMonth.split('T')[0]).reduce((s, e) => s + e.amount, 0) || 0
  const yearlyIncome = payments?.filter(p => p.status === 'paid' && new Date(p.paid_date) >= new Date(startOfYear)).reduce((s, p) => s + p.total_amount, 0) || 0
  const yearlyExpenses = expenses?.filter(e => e.date >= startOfYear.split('T')[0]).reduce((s, e) => s + e.amount, 0) || 0
  const netMonthly = monthlyIncome - monthlyExpenses
  const netYearly = yearlyIncome - yearlyExpenses
  const totalDeductible = expenses?.filter(e => e.tax_deductible).reduce((s, e) => s + e.amount, 0) || 0
  const expenseByCategory = EXPENSE_CATEGORIES.map(cat => ({
    ...cat,
    total: expenses?.filter(e => e.category === cat.value).reduce((s, e) => s + e.amount, 0) || 0
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Finances</h1>
          <p className="page-subtitle">Income, expenses, and tax reporting</p>
        </div>
        <div className="flex gap-2">
          <Link href="/landlord/finances/collections" className="btn bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20">
            <MessageCircle className="w-4 h-4" /> Collections Autopilot
          </Link>
          <Link href="/landlord/finances/expense" className="btn-secondary">
            <Receipt className="w-4 h-4" /> Log expense
          </Link>
          <Link href="/landlord/finances/payment" className="btn-landlord">
            <Plus className="w-4 h-4" /> Record payment
          </Link>
        </div>
      </div>

      {/* STRIPE CONNECT BANNER */}
      {profile?.stripe_account_status !== 'active' && (
        <div className="mb-6 card p-5 border-landlord/20 bg-landlord/5 flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-200 text-sm mb-1">Connect your bank account to collect rent online</p>
            <p className="text-slate-500 text-xs">Tenants can pay via ACH directly to your bank. Takes 5 minutes to set up.</p>
          </div>
          <Link href="/landlord/settings?tab=banking" className="btn-landlord whitespace-nowrap">
            <CreditCard className="w-4 h-4" /> Connect Bank
          </Link>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label:'Income This Month', value: formatCurrency(monthlyIncome), icon:TrendingUp, color:'text-green-400', bg:'bg-green-400/10' },
          { label:'Expenses This Month', value: formatCurrency(monthlyExpenses), icon:TrendingDown, color:'text-red-400', bg:'bg-red-400/10' },
          { label:'Net This Month', value: formatCurrency(netMonthly), icon:DollarSign, color: netMonthly >= 0 ? 'text-green-400' : 'text-red-400', bg:'bg-brand-400/10' },
          { label:'Net This Year', value: formatCurrency(netYearly), icon:TrendingUp, color:'text-landlord', bg:'bg-landlord/10' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">{s.label}</span>
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
              </div>
            </div>
            <p className={`font-display text-3xl ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PAYMENTS */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title mb-0">Payment History</h2>
          </div>
          {!payments?.length ? (
            <p className="text-center text-slate-500 text-sm py-10">No payments recorded yet</p>
          ) : (
            <div className="space-y-1">
              {payments.slice(0, 12).map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800/40 transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${p.status === 'paid' ? 'bg-green-400' : p.status === 'late' ? 'bg-red-400' : 'bg-yellow-400'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{p.tenants?.first_name} {p.tenants?.last_name}</p>
                    <p className="text-xs text-slate-500">{p.properties?.name} · Due {formatDate(p.due_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-200">{formatCurrency(p.total_amount)}</p>
                    <p className={`text-xs capitalize ${p.status === 'paid' ? 'text-green-400' : p.status === 'late' ? 'text-red-400' : 'text-yellow-400'}`}>{p.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* EXPENSE BREAKDOWN */}
        <div className="card p-6">
          <h2 className="section-title">Expense Breakdown</h2>
          {expenseByCategory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 text-sm mb-3">No expenses logged yet</p>
              <Link href="/landlord/finances/expense" className="text-landlord text-sm">Log your first expense →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {expenseByCategory.map(cat => (
                <div key={cat.value}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-400">{cat.label}</span>
                    <span className="text-sm font-medium text-slate-200">{formatCurrency(cat.total)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-landlord rounded-full transition-all"
                      style={{ width: `${Math.min(100, (cat.total / (yearlyExpenses || 1)) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-800 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Total expenses YTD</span>
              <span className="font-semibold text-slate-200">{formatCurrency(yearlyExpenses)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax deductible</span>
              <span className="font-semibold text-green-400">{formatCurrency(totalDeductible)}</span>
            </div>
          </div>

          <div className="mt-4">
            <Link href="/landlord/finances/schedule-e" className="btn-secondary w-full justify-center text-sm">
              Generate Schedule E Report →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
