// ============================================================
// ForgeFitOS — Weigh-in route loading state (Phase 4B.5)
// Geometry matches the final page; 4B.1 skeleton primitives;
// reduced-motion inherited; no fake values.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function WeighInLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <Skeleton className="h-9 w-72" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-72" />
      </div>
      <SkeletonCard className="h-28" />
      <SkeletonCard className="h-24" />
      <SkeletonCard className="h-48" />
    </div>
  )
}
