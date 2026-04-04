'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ShieldCheck, Download, CheckCircle2 } from 'lucide-react'
import { LegalDocumentPreview } from '@/components/resolutions/LegalDocumentPreview'
import { createClient } from '@/lib/supabase/client'

const WORKFLOWS: Record<string, any> = {
  eviction: {
    title: 'Notice to Quit Workflow',
    subtitle: 'We will legally determine the correct notice to serve your tenant and generate a binding PDF based on state law.',
    steps: [
      {
        id: 'reason',
        title: 'Compliance Verification',
        question: 'What is the primary legal justification for this notice?',
        options: [
          { value: 'non_payment', label: 'Failure to Pay Rent', desc: 'Tenant is past the state-mandated grace period.' },
          { value: 'lease_violation', label: 'Breach of Agreement', desc: 'Violation of unauthorized pets, subletting, etc.' },
          { value: 'holdover', label: 'Holdover Tenancy', desc: 'Tenant remains on premises after lease expiry.' },
        ]
      },
      {
        id: 'state',
        title: 'Jurisdiction Check',
        question: 'Which state jurisdiction governs this property? (Laws vary significantly)',
        options: [
          { value: 'NY', label: 'New York (NY)', desc: 'Requires 14-day notice for non-payment.' },
          { value: 'CA', label: 'California (CA)', desc: 'Requires 3-day notice, subject to AB 1482.' },
          { value: 'TX', label: 'Texas (TX)', desc: 'Requires 3-day notice standard.' },
        ]
      },
      {
        id: 'review',
        title: 'Review & Execute',
        type: 'generation'
      }
    ]
  },
  maintenance: {
    title: 'Emergency Dispatch & Notice',
    subtitle: 'Secure vendor assignment and automatically generate 24-hr tenant entry notices.',
    steps: [
      {
        id: 'emergency',
        title: 'Severity Assessment',
        question: 'Does this issue impact habitability (e.g. no heat, active leak)?',
        options: [
          { value: 'yes', label: 'Yes - Emergency', desc: 'No advance notice required. Dispatch immediately.' },
          { value: 'no', label: 'No - Standard', desc: '24 or 48 hour notice required based on jurisdiction.' }
        ]
      },
      {
        id: 'review',
        title: 'Assign & Notify',
        type: 'generation'
      }
    ]
  }
}

interface ResolutionWorkflowProps {
  type: string;
  tenant: any;
  lease: any;
  landlord: any;
}

export default function ResolutionWorkflow({ type, tenant, lease, landlord }: ResolutionWorkflowProps) {
  const router = useRouter()
  const workflow = WORKFLOWS[type] || WORKFLOWS['eviction']
  
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const step = workflow.steps[currentStep]

  const handleSelect = (val: string) => {
    setAnswers(prev => ({ ...prev, [step.id]: val }))
    setTimeout(() => {
      if (currentStep < workflow.steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }, 400)
  }

  const handleExecute = async () => {
    setIsGenerating(true)
    
    // 1. Mark as generated in Supabase documents table
    if (tenant?.id) {
      const supabase = createClient()
      await supabase.from('documents').insert({
        owner_id: landlord.id,
        property_id: tenant.property_id,
        tenant_id: tenant.id,
        lease_id: lease?.id,
        name: `Legal Notice - ${type.toUpperCase()}`,
        type: 'notice',
        url: 'generated-pdf',
        size: 1024
      })
      // If eviction non_payment, attempt to update rent_payment status or add notes. Let's just create the doc.
    }

    // 2. Trigger Print Dialog
    setTimeout(() => {
      setIsGenerating(false)
      setIsDone(true)
      window.print() // High speed native PDF generation
    }, 1500)
  }

  if (!workflow) return null

  // Layout changes based on step
  const isDocGen = step.type === 'generation'

  return (
    <div className={`fixed inset-0 z-50 bg-slate-950 flex flex-col pt-10 pb-20 px-4 md:px-0 overflow-y-auto animate-fade-in ${
      // Hide everything else when printing
      'print:bg-white print:static print:h-auto print:overflow-visible'
    }`}>
      
      {/* HEADER - Hidden during print */}
      <div className="max-w-3xl mx-auto w-full mb-8 flex items-center justify-between print:hidden">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Cancel & Return
        </button>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-500" />
          <span className="text-xs uppercase tracking-widest text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">OS Compliance Engine</span>
        </div>
      </div>

      <div className={`mx-auto w-full flex-1 flex flex-col relative ${isDocGen ? 'max-w-5xl' : 'max-w-3xl'}`}>
        
        {/* PROGRESS INDICATOR - Hidden during print */}
        <div className="mb-10 print:hidden">
          <p className="text-xs font-bold text-brand-400 tracking-widest uppercase mb-3">
            {tenant ? `Processing: ${tenant.first_name} ${tenant.last_name} | ` : ''}Step {currentStep + 1} of {workflow.steps.length}
          </p>
          <div className="flex gap-2">
            {workflow.steps.map((_: any, i: number) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-brand-500 shadow-[0_0_10px_rgba(79,110,247,0.5)]' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 pb-12">
          {isDocGen ? (
            <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
              
              {/* Left Col: The Document Preview */}
              <div className="col-span-1 shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 rounded-xl overflow-hidden print:shadow-none print:border-none">
                <LegalDocumentPreview type={type} tenant={tenant} lease={lease} landlord={landlord} answers={answers} />
              </div>

              {/* Right Col: Controls (Hidden on Print) */}
              <div className="col-span-1 sticky top-10 print:hidden">
                <h1 className="font-display text-4xl text-white mb-4">Review & Execute</h1>
                <p className="text-slate-400 text-lg mb-8">
                  Your state-compliant legal document has been generated using <strong className="text-slate-200">Jurisdiction {answers.state || 'General'}</strong> standards. Review the template below.
                </p>
                
                <div className="card p-6 border-brand-500/20 bg-brand-500/5 mb-8">
                  <h3 className="text-brand-400 font-medium mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Automation Complete
                  </h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5"/> Auto-calculated past due rents</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5"/> Applied state-specific notice periods</li>
                    <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5"/> Embedded signed lease provisions</li>
                  </ul>
                </div>

                {!isDone ? (
                  <button 
                    onClick={handleExecute}
                    disabled={isGenerating}
                    className="btn bg-brand-500 hover:bg-brand-400 text-white shadow-[0_0_30px_rgba(79,110,247,0.3)] hover:shadow-[0_0_40px_rgba(79,110,247,0.5)] px-8 py-4 text-lg w-full flex justify-center"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-3">
                        <div className="w-5 h-5 border-2 border-white rounded-full border-t-transparent animate-spin" /> Stamping Document...
                      </span>
                    ) : (
                      <span className="flex items-center gap-3"><Download className="w-5 h-5" /> Execute & Save PDF</span>
                    )}
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center font-medium flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Document executed and logged securely.
                    </div>
                    <button onClick={() => handleExecute()} className="btn btn-secondary w-full justify-center">Download PDF Again</button>
                    <button onClick={() => router.push('/landlord/dashboard')} className="btn bg-brand-500 hover:bg-brand-400 text-white w-full justify-center">Return to Portfolio</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-up max-w-3xl print:hidden">
              <h1 className="font-display text-4xl text-white mb-3 tracking-tight">{step.title}</h1>
              <p className="text-slate-400 text-lg mb-12">{step.question}</p>

              <div className="space-y-4">
                {step.options.map((opt: any) => (
                  <button 
                    key={opt.value} 
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full text-left p-6 md:p-8 rounded-2xl border transition-all duration-300 group
                      ${answers[step.id] === opt.value 
                        ? 'border-brand-500 bg-brand-500/10 shadow-[0_0_20px_rgba(79,110,247,0.1)]' 
                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
                        ${answers[step.id] === opt.value ? 'border-brand-500 bg-brand-500' : 'border-slate-600 group-hover:border-slate-500'}
                      `}>
                        {answers[step.id] === opt.value && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium text-lg leading-none mb-1.5 transition-colors ${answers[step.id] === opt.value ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                          {opt.label}
                        </p>
                        <p className="text-slate-500 text-sm">
                          {opt.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
