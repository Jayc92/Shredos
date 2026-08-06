// ============================================================
// ForgeFitOS — Routine detail route loading state (Phase 4B.6A)
// Geometry matches the final page; 4B.1 skeleton primitives;
// reduced-motion inherited; no fake values, no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function RoutineDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <SkeletonText lines={1} className="w-64" />
      </div>
      <Skeleton className="h-9 w-72" />
      <SkeletonCard className="h-32" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <div className="space-y-2">
        <SkeletonCard className="h-20" />
        <SkeletonCard className="h-20" />
        <SkeletonCard className="h-20" />
      </div>
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}
