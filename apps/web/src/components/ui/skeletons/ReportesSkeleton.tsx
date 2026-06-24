import { Skeleton } from '../Skeleton'

export function ReportesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex gap-3">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}