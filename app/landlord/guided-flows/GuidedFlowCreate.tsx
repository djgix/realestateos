'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export function GuidedFlowCreate({ flowTypes }: { flowTypes: string[] }) {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState(flowTypes[0] || 'non_payment')
  const [loading, setLoading] = useState(false)

  async function create() {
    setLoading(true)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('guided_flows').insert({
      owner_id: user!.id,
      type,
      total_steps: 5,
      current_step: 1,
      status: 'in_progress',
    })
    setLoading(false)
    if (error) toast.error(error.message)
    else {
      toast.success('Flow created')
      setOpen(false)
      window.location.reload()
    }
  }

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className="btn-landlord">
        <Plus className="w-4 h-4" /> New flow
      </button>
      {open && (
        <div className="mt-4 card p-4 flex flex-wrap gap-3 items-end">
          <div className="form-group mb-0">
            <label className="label">Type</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
              {flowTypes.map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <button type="button" onClick={create} disabled={loading} className="btn-secondary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
          </button>
        </div>
      )}
    </div>
  )
}
