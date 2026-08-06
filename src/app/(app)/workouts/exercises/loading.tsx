// ============================================================
// ForgeFitOS — Exercise library route loading state (Phase 4B.6A)
// Geometry matches the final page; 4B.1 skeleton primitives;
// reduced-motion inherited; no fake values, no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function ExerciseLibraryLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <SkeletonText lines={1} className="w-64" />
      </div>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-9 w-full rounded-lg" />
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-7 w-14 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="space-y-2">
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
      </div>
    </div>
  )
}
