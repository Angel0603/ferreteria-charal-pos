import { Skeleton } from '../Skeleton'

export function PerfilSkeleton() {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Avatar + info */}
      <div className="bg-surface rounded-xl border border-border p-6 flex items-center gap-5">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>

      {/* Dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Información personal */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-36" />
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-9 w-36 rounded-lg" />
            </div>
          </div>
        </div>

        {/* Seguridad */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-36" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-9 w-full rounded-lg" />
              <Skeleton className="h-1 w-full rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-44" />
              <Skeleton className="h-9 w-full rounded-lg" />
            </div>
            <div className="flex justify-end">
              <Skeleton className="h-9 w-44 rounded-lg" />
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}