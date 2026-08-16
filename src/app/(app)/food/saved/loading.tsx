// ============================================================
// ForgeFitOS — Saved meals route loading state (UI-6A)
// Geometry mirrors the rebuilt page: header with action slot,
// subnav, then the responsive card grid (1/2/3 columns). 4B.1
// skeleton primitives; reduced-motion inherited; no fake values,
// no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function SavedMealsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <SkeletonText lines={1} className="w-72" />
        </div>
        <Skeleton className="h-11 w-28" />
      </div>
      <Skeleton className="h-9 w-80" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 items-start">
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
      </div>
    </div>
  )
}
