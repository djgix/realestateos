'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Star, Phone, Mail, Wrench, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'appliance', label: 'Appliance Repair' },
  { value: 'structural', label: 'Structural / General' },
  { value: 'pest', label: 'Pest Control' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'other', label: 'Other / Handyman' },
]

const empty = { name: '', category: 'plumbing', phone: '', email: '', notes: '', preferred: false }

export default function ContractorsPage() {
  const [contractors, setContractors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ ...empty })
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')

  async function load() {
    const supabase = createClient()
    const { data } = await supabase
      .from('contractor_directory')
      .select('*')
      .order('preferred', { ascending: false })
      .order('name')
    setContractors(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('contractor_directory')
      .insert({ ...form, owner_id: user!.id })
    if (error) {
      toast.error('Failed to add contractor')
    } else {
      toast.success('Contractor added')
      setForm({ ...empty })
      setShowAdd(false)
      load()
    }
    setSaving(false)
  }

  async function togglePreferred(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from('contractor_directory').update({ preferred: !current }).eq('id', id)
    load()
  }

  async function deleteContractor(id: string) {
    if (!confirm('Delete this contractor?')) return
    const supabase = createClient()
    await supabase.from('contractor_directory').delete().eq('id', id)
    toast.success('Contractor removed')
    load()
  }

  const filtered = filterCategory === 'all' ? contractors : contractors.filter(c => c.category === filterCategory)

  return (
    <div>
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Contractor Directory</h1>
          <p className="page-subtitle">Your trusted vendors by trade. Preferred contractors auto-fill on maintenance dispatch.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-landlord">
          <Plus className="w-4 h-4" /> Add Contractor
        </button>
      </div>

      {/* FILTER */}
      <div className="flex gap-2 flex-wrap mb-6">
        <button onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterCategory === 'all' ? 'bg-landlord text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => setFilterCategory(c.value)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${filterCategory === c.value ? 'bg-landlord text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* ADD FORM */}
      {showAdd && (
        <div className="card p-6 mb-6 border-landlord/20">
          <h2 className="section-title mb-4">Add Contractor</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Name / Company</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input" required placeholder="e.g. Joe's Plumbing" />
              </div>
              <div className="form-group">
                <label className="label">Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="select">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="label">Phone (for SMS dispatch)</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="input" placeholder="+1 (555) 000-0000" />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input" placeholder="contractor@example.com" />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Notes</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="input" placeholder="e.g. Available weekdays, great pricing" />
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.preferred} onChange={e => setForm(f => ({ ...f, preferred: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-sm text-slate-300">Set as preferred for this category</span>
              </label>
              <p className="text-xs text-slate-600">(Auto-fills on dispatch)</p>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-landlord">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Contractor
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* LIST */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
      ) : !filtered.length ? (
        <div className="card p-16 text-center">
          <Wrench className="w-10 h-10 text-slate-600 mx-auto mb-4" />
          <h3 className="font-display text-xl text-slate-300 mb-2">No contractors yet</h3>
          <p className="text-slate-500 text-sm mb-6">Add your trusted vendors. Preferred contractors are automatically assigned when you dispatch maintenance.</p>
          <button onClick={() => setShowAdd(true)} className="btn-landlord inline-flex"><Plus className="w-4 h-4" /> Add your first contractor</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => (
            <div key={c.id} className={`card p-5 ${c.preferred ? 'border-landlord/30 bg-landlord/5' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-200">{c.name}</h3>
                    {c.preferred && <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />}
                  </div>
                  <span className="badge text-xs bg-slate-800 text-slate-400 capitalize">{c.category.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => togglePreferred(c.id, c.preferred)}
                    title={c.preferred ? 'Remove preferred' : 'Set as preferred'}
                    className={`p-1.5 rounded-lg transition-colors ${c.preferred ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-600 hover:text-yellow-400'}`}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteContractor(c.id)} className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-slate-600" />
                    {c.phone}
                  </a>
                )}
                {c.email && (
                  <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors">
                    <Mail className="w-3.5 h-3.5 text-slate-600" />
                    {c.email}
                  </a>
                )}
                {c.notes && <p className="text-xs text-slate-600 mt-2">{c.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
