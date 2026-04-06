export default function DashboardLoading() {
  return (
    <div className="animate-pulse pb-12">
      {/* Header */}
      <div className="page-header flex items-start justify-between mb-8">
        <div className="space-y-2">
          <div className="h-10 w-64 bg-slate-800 rounded-xl" />
          <div className="h-4 w-48 bg-slate-800/60 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-slate-800 rounded-xl" />
          <div className="h-9 w-32 bg-slate-800 rounded-xl" />
        </div>
      </div>
      {/* Feed skeleton */}
      <div className="h-4 w-40 bg-slate-800/60 rounded mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800/60 rounded" />
              <div className="h-2 w-1/2 bg-slate-800/40 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card space-y-2">
            <div className="h-3 w-20 bg-slate-800/60 rounded" />
            <div className="h-8 w-16 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      {/* Chart + tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <div className="h-5 w-40 bg-slate-800 rounded mb-4" />
          <div className="h-72 bg-slate-800/40 rounded-xl" />
        </div>
        <div className="card p-6 space-y-3">
          <div className="h-5 w-28 bg-slate-800 rounded mb-2" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-slate-800 mt-1.5 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-800/60 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
