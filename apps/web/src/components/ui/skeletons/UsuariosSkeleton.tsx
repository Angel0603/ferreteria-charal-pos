import { Skeleton } from '../Skeleton'

export function UsuariosSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-10 w-40 rounded-lg" />
      </div>

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border bg-border px-4 py-3 flex gap-8">
          {[160, 120, 100, 100, 80, 20].map((w, i) => (
            <Skeleton key={i} className={`h-3 w-${w}`} />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3">
              <div className="flex items-center gap-3" style={{ width: 160 }}>
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}