// ============================================================
// ForgeFitOS — Exercise detail route loading state (Phase 4B.5)
// Geometry matches the final page; 4B.1 skeleton primitives;
// reduced-motion inherited; no fake values.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function ExerciseDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <Skeleton className="h-9 w-72" />
      <SkeletonCard className="h-24" />
      {/* One or two charts depending on the existing metric selector —
          skeleton shows one primary chart region, no fake values. */}
      <SkeletonCard className="h-56" />
      <SkeletonCard className="h-24" />
      <SkeletonCard className="h-32" />
    </div>
  )
}
