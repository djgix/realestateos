export default function PropertiesLoading() {
  return (
    <div className="animate-pulse">
      <div className="page-header flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-9 w-40 bg-slate-800 rounded-xl" />
          <div className="h-4 w-52 bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-800 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex-shrink-0" />
              <div className="h-5 w-16 bg-slate-800/60 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800/60 rounded" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 bg-slate-800/40 rounded-xl" />
              <div className="h-10 bg-slate-800/40 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
