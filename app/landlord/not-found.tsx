import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function LandlordNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="card p-12 text-center max-w-md">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Home className="w-7 h-7 text-slate-500" />
        </div>
        <h2 className="font-display text-3xl text-slate-200 mb-2">Page not found</h2>
        <p className="text-slate-500 text-sm mb-8">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link href="/landlord/dashboard" className="btn-secondary inline-flex">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
