import { cn } from '@/lib/utils'

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={cn(
        'animate-pulse rounded-lg bg-surface-2',
        className
      )}
    />
  )
}