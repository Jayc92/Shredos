// ============================================================
// ForgeFitOS — Decisions route loading state (UI-6C)
// Geometry mirrors the loaded page: PageHeader block with the action
// slot, subnav strip, lifecycle explainer, filter chips, then the
// one-column / lg two-column card grid with natural heights. 4B.1
// skeleton primitives; no fake decision statuses or interactive
// controls.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function DecisionsLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <SkeletonText lines={1} className="w-96" />
        </div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <Skeleton className="h-9 w-80" />
      <SkeletonCard className="h-20" />
      <Skeleton className="h-8 w-72" />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
        <SkeletonCard className="h-32" />
      </div>
    </div>
  )
}
