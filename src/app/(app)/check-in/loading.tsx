// ============================================================
// ForgeFitOS — Weekly review route loading state (Phase 4B.4)
// Geometry matches the final page: header + subnav → period/evidence
// summary → 2-col domain grid → wide progression section → focus.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function WeeklyReviewLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <SkeletonText lines={1} className="w-80" />
      </div>
      <Skeleton className="h-9 w-64" />
      <SkeletonCard className="h-28" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-24" />
    </div>
  )
}
