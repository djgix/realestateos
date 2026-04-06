'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function LandlordError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card p-10 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="font-display text-2xl text-slate-100 mb-2">Something went wrong</h2>
        <p className="text-slate-400 text-sm mb-6">
          An error occurred loading this page. Your data is safe — try refreshing.
        </p>
        <button
          onClick={reset}
          className="btn-landlord inline-flex mx-auto"
        >
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      </div>
    </div>
  )
}
