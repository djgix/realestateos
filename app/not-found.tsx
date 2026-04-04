import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-8xl text-brand-500 mb-4">404</p>
        <h1 className="font-display text-3xl text-white mb-3">Page not found</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link href="/" className="btn-primary">Go home</Link>
      </div>
    </div>
  )
}
