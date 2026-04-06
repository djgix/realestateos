export default function MessagesLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-9 w-32 bg-slate-800 rounded-xl" />
          <div className="h-4 w-40 bg-slate-800/60 rounded" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-32 bg-slate-800 rounded-xl" />
          <div className="h-9 w-36 bg-slate-800 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card divide-y divide-slate-800/50 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="w-9 h-9 rounded-xl bg-slate-800 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-1/2 bg-slate-800 rounded" />
                <div className="h-3 w-3/4 bg-slate-800/60 rounded" />
              </div>
              <div className="h-3 w-16 bg-slate-800/40 rounded" />
            </div>
          ))}
        </div>
        <div className="card p-6 space-y-4">
          <div className="h-5 w-32 bg-slate-800 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/40 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
