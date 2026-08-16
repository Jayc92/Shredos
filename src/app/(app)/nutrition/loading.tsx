// ============================================================
// ForgeFitOS — Nutrition targets route loading state (UI-6A)
// Geometry mirrors the rebuilt page: header, subnav, then the lg
// two-column split — target/adjustment/form column plus the
// calculated-suggestion/trend column. 4B.1 skeleton primitives;
// reduced-motion inherited; no fake values, no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function NutritionLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <Skeleton className="h-9 w-80" />
      <div className="lg:grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6 space-y-5 lg:space-y-0">
        <div className="space-y-5">
          <SkeletonCard className="h-36" />
          <SkeletonCard className="h-32" />
          <SkeletonCard className="h-64" />
        </div>
        <div className="mt-5 space-y-5 lg:mt-0">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-56" />
        </div>
      </div>
    </div>
  )
}
