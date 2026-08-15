// ============================================================
// ForgeFitOS — Workouts route loading state (UI-5A)
// Geometry mirrors the rebuilt hub: header, then subnav strip, then
// resume/week blocks, then the past-workout disclosure, then the lg
// body grid (session column + supporting rail, natural heights). 4B.1 skeleton
// primitives; reduced-motion inherited; no fake values, no
// viewport traps.
// ============================================================

import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function WorkoutsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-9 w-72" />
      <SkeletonCard className="h-20" />
      <SkeletonCard className="h-16" />
      <div className="grid gap-5 lg:grid-cols-12 lg:items-start">
        <div className="space-y-2 lg:col-span-7 xl:col-span-8">
          <Skeleton className="h-5 w-40" />
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
        </div>
        <div className="space-y-5 lg:col-span-5 xl:col-span-4">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-16" />
        </div>
      </div>
    </div>
  )
}
