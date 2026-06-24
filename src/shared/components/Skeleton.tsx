import { cn } from './cn'

interface SkeletonProps {
  className?: string
  rows?: number
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('shimmer rounded bg-neutral-200', className)}
      aria-hidden="true"
      role="presentation"
    />
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-neutral-200 bg-surface p-6 space-y-3" aria-busy="true" aria-label="Loading...">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3" aria-hidden="true">
      <Skeleton className="h-9 w-9 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-0" aria-busy="true" aria-label="Loading table...">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-b border-neutral-100">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
        </div>
      ))}
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonRow, SkeletonTable }
