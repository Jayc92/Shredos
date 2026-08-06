// ============================================================
// ForgeFitOS — Today route loading state (Phase 4B.3)
//
// The page is a server component, so this renders during route
// transitions while the server assembles the data. Skeletons
// approximate the final geometry (header → primary action →
// status grid → review row) to avoid layout shift; the primitives
// honor prefers-reduced-motion (Phase 4B.1).
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function TodayLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-24" />
        <SkeletonText lines={1} className="w-48" />
      </div>
      <Skeleton className="h-[72px] w-full rounded-xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Lower utility/review grid. The real grid is 3 lg columns
          when Fasting is enabled and 2 when not; the skeleton cannot
          know the profile, so it renders the fasting-agnostic 2-col
          approximation — same row position, no layout jump for the
          common path. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}
