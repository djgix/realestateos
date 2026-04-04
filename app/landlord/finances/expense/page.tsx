'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { EXPENSE_CATEGORIES } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function LogExpensePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [properties, setProperties] = useState<any[]>([])
  const [form, setForm] = useState({
    property_id: '', category: 'repairs', amount: '', date: new Date().toISOString().split('T')[0],
    description: '', vendor: '', tax_deductible: true, notes: '',
  })

  useEffect(() => {
    async function load() {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data } = await supabase.from('properties').select('id, name').eq('owner_id', user!.id)
      setProperties(data || [])
      if (data?.length) setForm(f => ({ ...f, property_id: data[0].id }))
    }
    load()
  }, [])

  function set(k: string, v: any) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('expenses').insert({
      owner_id: user!.id,
      property_id: form.property_id,
      category: form.category,
      amount: Number(form.amount),
      date: form.date,
      description: form.description,
      vendor: form.vendor || null,
      tax_deductible: form.tax_deductible,
      notes: form.notes || null,
    })

    if (error) { toast.error(error.message); setLoading(false) }
    else { toast.success('Expense logged!'); router.push('/landlord/finances') }
  }

  const selectedCat = EXPENSE_CATEGORIES.find(c => c.value === form.category)

  return (
    <div className="max-w-lg mx-auto">
      <div className="page-header flex items-center gap-4">
        <Link href="/landlord/finances" className="btn-ghost p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <div>
          <h1 className="page-title mb-0">Log Expense</h1>
          <p className="page-subtitle">Track a property expense</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div className="form-group">
          <label className="label">Property *</label>
          <select required value={form.property_id} onChange={e => set('property_id', e.target.value)} className="select">
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="label">Category *</label>
          <select value={form.category} onChange={e => set('category', e.target.value)} className="select">
            {EXPENSE_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="form-group">
            <label className="label">Amount *</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
              <input required type="number" step="0.01" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" className="input pl-8" />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Date *</label>
            <input required type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input" />
          </div>
        </div>
        <div className="form-group">
          <label className="label">Description *</label>
          <input required value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Replaced kitchen faucet" className="input" />
        </div>
        <div className="form-group">
          <label className="label">Vendor / Payee</label>
          <input value={form.vendor} onChange={e => set('vendor', e.target.value)} placeholder="e.g. Home Depot, Joe's Plumbing" className="input" />
        </div>
        <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
          <input type="checkbox" id="deductible" checked={form.tax_deductible} onChange={e => set('tax_deductible', e.target.checked)} className="w-4 h-4 accent-landlord" />
          <div>
            <label htmlFor="deductible" className="text-sm font-medium text-slate-200 cursor-pointer">Tax deductible</label>
            <p className="text-xs text-slate-500">{selectedCat?.deductible ? 'This category is typically deductible' : 'Verify with your accountant'}</p>
          </div>
        </div>
        <div className="form-group">
          <label className="label">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} className="textarea" />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-landlord flex-1 justify-center py-3">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log Expense'}
          </button>
          <Link href="/landlord/finances" className="btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
