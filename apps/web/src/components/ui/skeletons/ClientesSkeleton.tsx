import { Skeleton } from '../Skeleton'

export function ClientesSkeleton() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-4 space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-xl border border-border p-4 flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border bg-border px-4 py-3 flex gap-8">
          {[160, 100, 100, 120, 80, 40].map((w, i) => (
            <div key={i} style={{ width: w }}>
              <Skeleton className="h-3" />
            </div>
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3">
              <div className="flex items-center gap-3" style={{ width: 160 }}>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-10 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}