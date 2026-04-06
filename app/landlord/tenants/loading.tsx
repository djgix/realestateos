export default function TenantsLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-9 w-36 bg-slate-800 rounded-xl" />
          <div className="h-4 w-48 bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-28 bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="stat-card space-y-2">
            <div className="h-3 w-20 bg-slate-800/60 rounded" />
            <div className="h-8 w-12 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
