'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Users, FileText, CreditCard, CheckCircle2, ArrowRight, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

const STEPS = [
  { id: 1, title: 'Add your first property', icon: Building2, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
  { id: 2, title: 'Add your first tenant', icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { id: 3, title: 'Create a lease', icon: FileText, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { id: 4, title: 'Connect your bank', icon: CreditCard, color: 'text-brand-400', bg: 'bg-brand-500/10', border: 'border-brand-500/20' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Step 1 — property
  const [propName, setPropName] = useState('')
  const [propAddress, setPropAddress] = useState('')
  const [propCity, setPropCity] = useState('')
  const [propState, setPropState] = useState('')
  const [propType, setPropType] = useState('single_family')
  const [propUnits, setPropUnits] = useState('1')
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null)

  // Step 2 — tenant
  const [tenantFirst, setTenantFirst] = useState('')
  const [tenantLast, setTenantLast] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [tenantPhone, setTenantPhone] = useState('')

  async function submitProperty() {
    if (!propName || !propAddress) { toast.error('Property name and address are required'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('properties').insert({
        owner_id: user!.id, name: propName, address: propAddress,
        city: propCity, state: propState, type: propType, units: parseInt(propUnits) || 1,
      }).select('id').single()
      if (error) throw error
      setCreatedPropertyId(data.id)
      setStep(2)
    } catch { toast.error('Failed to save property') }
    setSaving(false)
  }

  async function submitTenant() {
    if (!tenantFirst || !tenantEmail) { toast.error('First name and email are required'); return }
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('tenants').insert({
        owner_id: user!.id, first_name: tenantFirst, last_name: tenantLast,
        email: tenantEmail, phone: tenantPhone,
        property_id: createdPropertyId, status: 'active',
      })
      setStep(3)
    } catch { toast.error('Failed to save tenant') }
    setSaving(false)
  }

  async function completeOnboarding() {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ settings: { onboarding_complete: true } }).eq('id', user!.id)
    router.push('/landlord/dashboard')
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                step > s.id ? 'bg-green-500 text-white' :
                step === s.id ? 'bg-brand-500 text-white' :
                'bg-slate-800 text-slate-500'
              }`}>
                {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 sm:w-24 mx-1 transition-all ${step > s.id ? 'bg-green-500' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {/* Step 1 — Property */}
          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-400/10 border border-green-400/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-100">Add your first property</h1>
                  <p className="text-slate-500 text-sm">Start by adding a property you manage</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Property name <span className="text-red-400">*</span></label>
                  <input className="input" placeholder="e.g. 123 Main St Unit A" value={propName} onChange={e => setPropName(e.target.value)} />
                </div>
                <div>
                  <label className="label">Street address <span className="text-red-400">*</span></label>
                  <input className="input" placeholder="123 Main Street" value={propAddress} onChange={e => setPropAddress(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">City</label>
                    <input className="input" placeholder="Los Angeles" value={propCity} onChange={e => setPropCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">State</label>
                    <input className="input" placeholder="CA" maxLength={2} value={propState} onChange={e => setPropState(e.target.value.toUpperCase())} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Type</label>
                    <select className="select" value={propType} onChange={e => setPropType(e.target.value)}>
                      <option value="single_family">Single Family</option>
                      <option value="multi_family">Multi Family</option>
                      <option value="condo">Condo</option>
                      <option value="apartment">Apartment</option>
                      <option value="commercial">Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Units</label>
                    <input className="input" type="number" min={1} value={propUnits} onChange={e => setPropUnits(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <button onClick={completeOnboarding} className="text-slate-500 text-sm hover:text-slate-400 transition-colors">Skip for now</button>
                <button onClick={submitProperty} disabled={saving} className="btn-landlord">
                  {saving ? 'Saving...' : 'Continue'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Step 2 — Tenant */}
          {step === 2 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-100">Add your first tenant</h1>
                  <p className="text-slate-500 text-sm">Who lives at {propName}?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">First name <span className="text-red-400">*</span></label>
                    <input className="input" placeholder="Jane" value={tenantFirst} onChange={e => setTenantFirst(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Last name</label>
                    <input className="input" placeholder="Doe" value={tenantLast} onChange={e => setTenantLast(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Email <span className="text-red-400">*</span></label>
                  <input className="input" type="email" placeholder="jane@example.com" value={tenantEmail} onChange={e => setTenantEmail(e.target.value)} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" type="tel" placeholder="+1 (555) 000-0000" value={tenantPhone} onChange={e => setTenantPhone(e.target.value)} />
                </div>
              </div>
              <div className="flex items-center justify-between mt-6">
                <button onClick={() => setStep(3)} className="text-slate-500 text-sm hover:text-slate-400 transition-colors">Skip for now</button>
                <button onClick={submitTenant} disabled={saving} className="btn-landlord">
                  {saving ? 'Saving...' : 'Continue'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Step 3 — Lease */}
          {step === 3 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-400/10 border border-purple-400/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-100">Create a lease</h1>
                  <p className="text-slate-500 text-sm">Set rent amount, dates, and generate the lease</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                The lease builder lets you set the monthly rent, due day, start and end dates, and deposit amount. Once activated, REALESTATEos automatically creates 12 months of payment records and sends the tenant a portal invite.
              </p>
              <div className="flex items-center justify-between">
                <button onClick={() => setStep(4)} className="text-slate-500 text-sm hover:text-slate-400 transition-colors">Skip for now</button>
                <Link
                  href={createdPropertyId ? `/landlord/leases/new?property=${createdPropertyId}` : '/landlord/leases/new'}
                  className="btn-landlord"
                  onClick={() => setStep(4)}
                >
                  Open lease builder <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}

          {/* Step 4 — Bank */}
          {step === 4 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-100">Connect your bank</h1>
                  <p className="text-slate-500 text-sm">Receive rent directly to your bank account</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Connect a bank account via Stripe to receive rent payments directly. Your tenants can pay online and funds are deposited automatically. You can skip this and connect later in Settings → Bank Account.
              </p>
              <div className="flex items-center justify-between">
                <button onClick={completeOnboarding} className="text-slate-500 text-sm hover:text-slate-400 transition-colors">Skip for now</button>
                <Link href="/landlord/settings?tab=banking" className="btn-landlord" onClick={completeOnboarding}>
                  Connect bank <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-slate-600 text-xs mt-4">
          You can always come back and complete these steps from your dashboard.
        </p>
      </div>
    </div>
  )
}
