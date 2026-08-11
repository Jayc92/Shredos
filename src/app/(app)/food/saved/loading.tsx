// ============================================================
// ForgeFitOS — Saved meals route loading state (Phase 4B.6C)
// Geometry matches the final page; 4B.1 skeleton primitives;
// reduced-motion inherited; no fake values, no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function SavedMealsLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <Skeleton className="h-9 w-80" />
      <div className="space-y-3">
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
        <SkeletonCard className="h-28" />
      </div>
    </div>
  )
}
