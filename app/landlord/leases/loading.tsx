export default function LeasesLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-9 w-28 bg-slate-800 rounded-xl" />
          <div className="h-4 w-44 bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card space-y-2">
            <div className="h-3 w-20 bg-slate-800/60 rounded" />
            <div className="h-8 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      <div className="card divide-y divide-slate-800/50 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-1/3 bg-slate-800 rounded" />
              <div className="h-3 w-1/4 bg-slate-800/60 rounded" />
            </div>
            <div className="h-4 w-20 bg-slate-800/60 rounded" />
            <div className="h-5 w-14 bg-slate-800/40 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
