// ============================================================
// ForgeFitOS — Weekly review route loading state (UI-6C)
// Geometry mirrors the loaded page: PageHeader block, subnav strip,
// the review-period card, then the lg two-column domain grid. 4B.1
// skeleton primitives; no fake statuses, confidence claims, or
// interactive controls.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function CheckInLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <SkeletonText lines={1} className="w-96" />
      </div>
      <Skeleton className="h-9 w-64" />
      <SkeletonCard className="h-28" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-32 lg:col-span-2" />
        <SkeletonCard className="h-48 lg:col-span-2" />
      </div>
    </div>
  )
}
