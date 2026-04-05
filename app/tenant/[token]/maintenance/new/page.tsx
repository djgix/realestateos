'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Wrench, Send, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { value: 'plumbing', label: 'Plumbing (leaks, drains, toilets)' },
  { value: 'electrical', label: 'Electrical (outlets, lights, breakers)' },
  { value: 'hvac', label: 'HVAC (heating, cooling, ventilation)' },
  { value: 'appliance', label: 'Appliance (fridge, stove, washer/dryer)' },
  { value: 'structural', label: 'Structural (doors, windows, walls, roof)' },
  { value: 'pest', label: 'Pest Control' },
  { value: 'landscaping', label: 'Landscaping / Exterior' },
  { value: 'other', label: 'Other' },
]

export default function SubmitMaintenancePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [form, setForm] = useState({ title: '', description: '', category: '', priority: 'normal' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title || !form.description || !form.category) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/tenant/${token}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to submit')
      setSubmitted(true)
    } catch {
      toast.error('Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-green-400/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-400/20">
            <Send className="w-7 h-7 text-green-400" />
          </div>
          <h1 className="font-display text-2xl text-slate-100 mb-2">Request Submitted!</h1>
          <p className="text-slate-400 text-sm mb-6">Your landlord has been notified and will respond shortly. You'll receive an update by email when a contractor is assigned.</p>
          <Link href={`/tenant/${token}`} className="bg-landlord hover:bg-landlord/90 text-white px-6 py-3 rounded-xl font-semibold inline-block transition-colors">
            Back to Portal
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href={`/tenant/${token}`} className="text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-400" />
            <h1 className="font-semibold text-slate-200">Submit Maintenance Request</h1>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="card p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Issue Title <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Kitchen sink is leaking under the cabinet"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category <span className="text-red-400">*</span>
              </label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="select"
                required
              >
                <option value="">Select a category...</option>
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Urgency
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'normal', label: 'Normal', color: 'border-blue-500/40 text-blue-400 bg-blue-500/5' },
                  { value: 'high', label: 'High', color: 'border-orange-500/40 text-orange-400 bg-orange-500/5' },
                  { value: 'emergency', label: 'Emergency', color: 'border-red-500/40 text-red-400 bg-red-500/5' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, priority: opt.value }))}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${form.priority === opt.value ? opt.color : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {form.priority === 'emergency' && (
                <p className="text-red-400 text-xs mt-2">⚠️ Emergency requests are immediately escalated to your landlord.</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                placeholder="Describe the issue in detail. When did it start? What have you already tried?"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={5}
                className="input resize-none"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-landlord hover:bg-landlord/90 text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Send className="w-4 h-4" /> Submit Request</>}
          </button>
          <p className="text-slate-600 text-xs text-center">Your landlord will be notified immediately.</p>
        </form>
      </div>
    </div>
  )
}
