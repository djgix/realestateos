'use client'

import { useState } from 'react'
import { ArrowLeft, Clock, Wrench, AlertTriangle, MessageSquare, Zap, Activity } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function MaintenanceClient({ req, tenant, property }: { req: any, tenant: any, property: any }) {
  const router = useRouter()
  const [status, setStatus] = useState(req.status)
  const [isDispatching, setIsDispatching] = useState(false)
  const [logs, setLogs] = useState<{time: string, msg: string, type: string}[]>([])

  const addLog = (msg: string, type: 'info' | 'success' | 'warning' = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, type }])
  }

  const handleDispatch = () => {
    setIsDispatching(true)
    addLog('Initializing AI Autopilot parameters...', 'info')
    
    setTimeout(() => {
      setStatus('in_progress')
      addLog(`Analyzing category: [${req.category.toUpperCase()}]`, 'info')
    }, 1000)

    setTimeout(() => {
      addLog('Drafting 24-hr Entry Notice for Tenant...', 'info')
    }, 2500)

    setTimeout(() => {
      addLog(`Sending SMS Notice to ${tenant?.phone || '(555) 000-0000'}`, 'success')
    }, 3500)

    setTimeout(() => {
      addLog('Pinging local available preferred vendors...', 'info')
    }, 4500)

    setTimeout(() => {
      addLog(`Vendor Assigned: 'Joe's Plumbing & Heating' (Est: $250.00)`, 'success')
      setIsDispatching(false)
    }, 6000)
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-12">
      <Link href="/landlord/maintenance" className="text-sm text-slate-500 hover:text-white flex items-center gap-2 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Queue
      </Link>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-display text-4xl text-slate-100">{req.title}</h1>
            <span className={`badge ${status === 'open' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-blue-500/20 text-blue-400 border border-blue-500/20'}`}>
              {status.toUpperCase()}
            </span>
            {req.priority === 'emergency' && (
              <span className="badge bg-red-500/20 text-red-500 border border-red-500/20 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Habitability Emergency
              </span>
            )}
          </div>
          <p className="text-slate-400 flex items-center gap-2">
            Requested {formatDate(req.created_at)} · {property?.name} · Unit Occupied by {tenant?.first_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COL: Ticket Details */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6 bg-slate-900 border-slate-800">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Tenant Report</h3>
            <p className="text-slate-200 text-lg leading-relaxed">{req.description}</p>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="card px-4 py-3 flex-1 flex items-center gap-3">
              <Wrench className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Category</p>
                <p className="text-slate-200 font-medium capitalize">{req.category}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COL: PM Autopilot */}
        <div className="lg:col-span-2">
          <div className="card p-6 border-brand-500/30 bg-slate-900 shadow-[0_0_40px_rgba(79,110,247,0.1)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 blur-2xl rounded-full -mr-16 -mt-16" />
            
            <h3 className="flex items-center gap-2 text-brand-400 font-medium mb-4 pb-4 border-b border-slate-800">
              <Activity className="w-4 h-4" /> Autopilot Dispatch Engine
            </h3>

            {status === 'open' ? (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm mb-6">Skip the phone calls. AI will generate the required legally compliant notice, instantly text the tenant, and automatically assign the cheapest available preferred vendor from your network.</p>
                <button 
                  onClick={handleDispatch}
                  disabled={isDispatching}
                  className="btn bg-brand-500 hover:bg-brand-400 text-white shadow-lg shadow-brand-500/20 w-full justify-center"
                >
                  {isDispatching ? 'Initiating...' : '1-Click Auto Dispatch'} 
                  {!isDispatching && <Zap className="w-4 h-4 ml-1" />}
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 font-mono text-[10px] sm:text-xs text-slate-400 p-4 rounded-xl border border-slate-800 h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-slate-600">Waiting for engine...</p>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="text-slate-600 flex-shrink-0">[{log.time}]</span>
                        <span className={log.type === 'success' ? 'text-green-400' : log.type === 'warning' ? 'text-orange-400' : 'text-slate-300'}>
                          {log.msg}
                        </span>
                      </div>
                    ))}
                    {isDispatching && (
                      <div className="flex items-center gap-2 mt-4 text-brand-400">
                        <span className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
                        Processing...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
