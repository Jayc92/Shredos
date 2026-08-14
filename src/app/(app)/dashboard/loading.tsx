// ============================================================
// ForgeFitOS — Today route loading state (UI-3)
//
// The dashboard layout is now preference-driven, so the skeleton
// cannot know the personalized composition. It renders a STABLE
// GENERIC approximation — header, primary action, then a neutral
// widget grid (three compact + one full + half pair, matching the
// canonical DEFAULT) — which avoids promising any one exact layout
// while keeping loading-to-loaded shift modest for common configs.
// Dark tokens via the skeleton primitives; aria-hidden;
// reduced-motion safe; no fake values.
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
      {/* Generic widget grid (canonical-default approximation) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 xl:gap-5 items-start">
        <div className="sm:col-span-1 lg:col-span-4"><SkeletonCard /></div>
        <div className="sm:col-span-1 lg:col-span-4"><SkeletonCard /></div>
        <div className="sm:col-span-1 lg:col-span-4"><SkeletonCard /></div>
        <div className="sm:col-span-2 lg:col-span-12">
          <Skeleton className="h-56 w-full rounded-xl" />
        </div>
        <div className="sm:col-span-1 lg:col-span-6"><SkeletonCard /></div>
        <div className="sm:col-span-1 lg:col-span-6"><SkeletonCard /></div>
      </div>
    </div>
  )
}
