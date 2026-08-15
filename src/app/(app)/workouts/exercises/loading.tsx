// ============================================================
// ForgeFitOS — Exercise library route loading state (UI-5A)
// Geometry mirrors the rebuilt library: header, then subnav strip,
// then 44px search, then filter chips, then the two-column exercise
// grid at lg+ (single column on mobile). 4B.1 skeleton primitives; reduced-
// motion inherited; no fake values, no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function ExerciseLibraryLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <SkeletonText lines={1} className="w-64" />
      </div>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-11 w-full rounded-lg" />
      <div className="flex flex-wrap gap-1.5">
        <Skeleton className="h-7 w-14 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid gap-2 lg:grid-cols-2 lg:items-start">
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
        <SkeletonCard className="h-16" />
      </div>
    </div>
  )
}
