import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { GuidedFlowCreate } from './GuidedFlowCreate'

const FLOW_TYPES = [
  'eviction',
  'non_payment',
  'lease_violation',
  'lease_expiry',
  'early_termination',
  'property_damage',
  'entry_notice',
  'rent_increase',
  'move_out',
  'tax_time',
] as const

export default async function GuidedFlowsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: flows } = await supabase
    .from('guided_flows')
    .select('*, properties(name)')
    .eq('owner_id', user!.id)
    .order('updated_at', { ascending: false })

  return (
    <div>
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Guided flows</h1>
          <p className="page-subtitle">Step-by-step legal and operations checklists tied to your portfolio.</p>
        </div>
        <GuidedFlowCreate flowTypes={[...FLOW_TYPES]} />
      </div>

      {!flows?.length ? (
        <div className="card p-12 text-center text-slate-500">
          No flows yet. Start one to track eviction prep, rent increases, move-out, or tax season tasks.
        </div>
      ) : (
        <div className="space-y-3">
          {flows.map((f: any) => (
            <div key={f.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-slate-200 font-medium capitalize">{f.type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {f.properties?.name || 'No property'} · Step {f.current_step}/{f.total_steps} · {f.status} · Updated {formatDate(f.updated_at)}
                </p>
              </div>
              <Link href={`/landlord/legal?flow=${f.id}`} className="btn-secondary text-sm">
                Continue <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
