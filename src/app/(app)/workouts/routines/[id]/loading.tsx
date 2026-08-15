// ============================================================
// ForgeFitOS — Routine detail route loading state (UI-5A)
// Geometry mirrors the rebuilt detail: back link, then subnav
// strip, then the lg grid (routine identity + start on the left,
// exercise rows + add control on the right, natural heights);
// single column below.
// 4B.1 skeleton primitives; reduced-motion inherited; no fake
// values, no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard } from '@/components/ui/skeleton'

export default function RoutineDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6" aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
        <div className="space-y-4 lg:col-span-5 xl:col-span-4">
          <SkeletonCard className="h-32" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-4 lg:col-span-7 xl:col-span-8">
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
          <SkeletonCard className="h-20" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
