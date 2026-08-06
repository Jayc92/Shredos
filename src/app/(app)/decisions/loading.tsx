// ============================================================
// ForgeFitOS — Decisions route loading state (Phase 4B.4)
// Geometry matches the final page: header → subnav → lifecycle strip
// → filter chip row → decision card stack.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function DecisionsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="flex gap-1.5 overflow-hidden">
        <Skeleton className="h-7 w-14 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
