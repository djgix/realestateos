import { createClient } from '@/lib/supabase/server'
import { FileText, Zap, Scale, Settings, Users, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const RESOLUTIONS = [
  { id: 'eviction', title: 'Eviction & Notices', desc: 'Legally binding notices to quit, non-payment forms, and holdover tracking.', icon: Scale, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  { id: 'maintenance', title: 'Maintenance Dispatch', desc: 'Vendor assignment, 24-hr entry notices, and repair compliance.', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'lease', title: 'Lease Processing', desc: 'Renewals, rent increases, and automated end-of-tenancy documents.', icon: FileText, color: 'text-green-500', bg: 'bg-green-500/10' },
  { id: 'tax', title: 'Schedule E Generation', desc: 'Automated tax document generation for your CPA.', icon: Settings, color: 'text-purple-500', bg: 'bg-purple-500/10' },
]

export default async function ResolutionsHub() {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="page-header mb-12 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/20 mb-6">
          <Scale className="w-8 h-8 text-brand-400" />
        </div>
        <h1 className="font-display text-4xl font-light text-slate-100 mb-3">Action Center</h1>
        <p className="text-slate-400 text-lg max-w-2xl">
          Legally binding workflows engineered to resolve property management issues automatically. Select a procedure to begin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {RESOLUTIONS.map(res => (
          <Link key={res.id} href={`/landlord/resolutions/${res.id}`} className="card p-6 group hover:border-brand-500/50 transition-all cursor-pointer relative overflow-hidden flex flex-col border border-white/5">
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${res.bg}`} />
            
            <div className={`w-12 h-12 rounded-2xl ${res.bg} flex items-center justify-center mb-6 relative z-10`}>
              <res.icon className={`w-6 h-6 ${res.color}`} />
            </div>
            
            <h2 className="text-xl font-medium text-slate-100 mb-2 relative z-10">{res.title}</h2>
            <p className="text-slate-400 text-sm mb-6 flex-1 relative z-10 leading-relaxed">{res.desc}</p>
            
            <div className="flex items-center text-brand-400 text-sm font-medium relative z-10 group-hover:translate-x-1 transition-transform">
              Start Procedure <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-12 p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center">
        <p className="text-slate-500 text-sm leading-relaxed max-w-2xl mx-auto">
          Built-in workflows automatically parse your state and local jurisdiction laws. 
          RealEstateOS does not provide formal legal advice, but ensures all document templates strictly adhere to statutory requirements.
        </p>
      </div>
    </div>
  )
}
