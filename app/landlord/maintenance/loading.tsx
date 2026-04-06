export default function MaintenanceLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-9 w-40 bg-slate-800 rounded-xl" />
          <div className="h-4 w-44 bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0" />
            <div className="space-y-2">
              <div className="h-6 w-8 bg-slate-800 rounded" />
              <div className="h-3 w-16 bg-slate-800/60 rounded" />
            </div>
          </div>
        ))}
      </div>
      <div className="card divide-y divide-slate-800/50 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-2/3 bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-800/60 rounded-full" />
            <div className="h-5 w-14 bg-slate-800/60 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
