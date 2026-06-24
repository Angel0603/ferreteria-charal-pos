import { Skeleton } from "../Skeleton";

export function InventarioSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-2 p-1 rounded-xl w-fit">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-lg" />
        ))}
      </div>

      {/* Buscador */}
      <div className="bg-surface rounded-xl border border-border p-4">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>

      {/* Tabla */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="border-b border-border bg-surface-2 px-4 py-3 flex gap-8">
          {[40, 24, 20, 20, 16, 16].map((w, i) => (
            <div key={i} style={{ width: w }}>
              <Skeleton className="h-3" />
            </div>
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-4 py-3">
              <div className="flex items-center gap-3" style={{ width: 160 }}>
                <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-7 w-12 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}