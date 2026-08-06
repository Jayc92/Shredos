// ============================================================
// ForgeFitOS — Coach route loading state (Phase 4B.4)
// Geometry matches the final page: header + subnav → primary action
// card → secondary two-column grid → readiness panel. 4B.1 skeleton
// primitives; reduced-motion inherited.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function CoachLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <Skeleton className="h-9 w-64" />
      <SkeletonCard className="h-40" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="h-24" />
    </div>
  )
}
