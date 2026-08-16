// ============================================================
// ForgeFitOS — Food log route loading state (UI-6A)
// Geometry mirrors the rebuilt wide-route page: header, subnav, date
// navigation, then the lg two-column split — meal-section feature
// column plus the supporting rail (macro summary, shortcuts) — with
// the rail stacking FIRST on mobile exactly like the loaded page.
// 4B.1 skeleton primitives; reduced-motion inherited; no fake
// values, no false expanded-list state, no viewport traps.
// ============================================================

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function FoodLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <Skeleton className="h-9 w-80" />
      <Skeleton className="h-10 w-full" />
      <div className="lg:flex lg:items-start lg:gap-6">
        <div className="space-y-4 lg:order-2 lg:w-80 lg:flex-shrink-0">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-16" />
          <SkeletonCard className="h-16" />
        </div>
        <div className="mt-4 space-y-4 lg:order-1 lg:mt-0 lg:min-w-0 lg:flex-1">
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
          <SkeletonCard className="h-24" />
        </div>
      </div>
    </div>
  )
}
