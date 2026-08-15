// ============================================================
// ForgeFitOS — Progress route loading state (Phase 4B.5; UI-4
// geometry). Mirrors the rebuilt page: header, subnav, summary
// tiles, filter chips, overview grid, coverage card, PR card, and
// the feature-chart (8) + nutrition (4) split. 4B.1 skeleton
// primitives; reduced-motion inherited; no fake values.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function ProgressLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 lg:p-6 xl:space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <Skeleton className="h-9 w-72" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
      <div className="flex gap-1.5 overflow-hidden">
        <Skeleton className="h-7 w-14 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-28" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 xl:gap-5 items-start">
        <div className="lg:col-span-8">
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
        <div className="lg:col-span-4">
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}
