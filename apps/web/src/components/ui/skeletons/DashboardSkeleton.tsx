import { Skeleton } from '../Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-9 rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Ventas recientes */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="space-y-1.5 items-end flex flex-col">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="bg-surface rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="divide-y divide-border">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}