// ============================================================
// ForgeFitOS — Routines route loading state (UI-5A)
// Geometry mirrors the rebuilt list: header, then subnav strip,
// then the responsive routine-card grid (single column on mobile). 4B.1
// skeleton primitives; reduced-motion inherited; no fake values,
// no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function RoutinesLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-36" />
        <SkeletonText lines={1} className="w-64" />
      </div>
      <Skeleton className="h-9 w-72" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:items-start">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-24" />
      </div>
    </div>
  )
}
