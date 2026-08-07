// ============================================================
// ForgeFitOS — Workout detail route loading state (Phase 4B.6B)
// Geometry matches the final page: back link + Train subnav strip →
// session header/status region → exercise block skeletons → notes
// region → add-exercise strip. 4B.1 skeleton primitives; no fake
// values; reduced-motion inherited.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function WorkoutDetailLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6" aria-hidden="true">
      <SkeletonText lines={1} className="w-24" />
      <Skeleton className="h-9 w-72" />
      <SkeletonCard className="h-36" />
      <SkeletonCard className="h-24" />
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-40" />
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}
