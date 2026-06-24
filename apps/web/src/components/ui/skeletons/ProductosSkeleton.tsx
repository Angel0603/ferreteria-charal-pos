import { Skeleton } from '../Skeleton'

export function ProductosSkeleton() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      {/* Filtros */}
      <div className="bg-surface rounded-xl border border-border p-4 flex gap-3">
        <Skeleton className="h-9 flex-1 rounded-lg" />
        <Skeleton className="h-9 w-48 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border bg-surface-2 px-4 py-3 flex gap-8">
          {[140, 100, 80, 80, 80, 60, 60, 20].map((w, i) => (
            <Skeleton key={i} className="h-3" style={{ width: w }} />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-12 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}