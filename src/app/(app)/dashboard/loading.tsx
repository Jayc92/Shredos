// ============================================================
// ForgeFitOS — Today route loading state (UI-2 geometry)
//
// Mirrors the rebuilt page's major regions (header → primary action
// → metric-tile row → 12-column main grid) with the same container
// and responsive families, so loading-to-loaded produces no major
// jump. The skeleton cannot know fasting_enabled, so the lower
// region renders the fasting-agnostic half-width pair — same row
// positions either way. Dark tokens via the skeleton primitives;
// aria-hidden; reduced-motion safe (4B.1 block); no fake values.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function TodayLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 lg:p-6 xl:space-y-5" aria-hidden="true">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <SkeletonText lines={1} className="w-40" />
      </div>
      {/* Primary action */}
      <Skeleton className="h-[72px] w-full rounded-xl" />
      {/* Metric tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      {/* Main grid: weight feature + rail, then half-width pair */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 xl:gap-5 items-start">
        <div className="sm:col-span-2 lg:col-span-8">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
        <div className="grid gap-4 content-start items-start sm:col-span-2 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-1 xl:gap-5">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="sm:col-span-1 lg:col-span-6">
          <SkeletonCard />
        </div>
        <div className="sm:col-span-1 lg:col-span-6">
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}
