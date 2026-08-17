// ============================================================
// ForgeFitOS — Coach route loading state (UI-6C)
// Geometry mirrors the loaded page: PageHeader block, subnav strip,
// primary action card, then the lg two-column secondary grid and the
// readiness panel. 4B.1 skeleton primitives; no fake recommendation
// text, confidence claims, or interactive controls.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function CoachLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <SkeletonText lines={1} className="w-80" />
      </div>
      <Skeleton className="h-9 w-64" />
      <SkeletonCard className="h-44" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-36" />
      </div>
      <SkeletonCard className="h-40" />
    </div>
  )
}
