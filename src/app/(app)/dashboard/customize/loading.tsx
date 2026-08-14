// ForgeFitOS — Customize dashboard loading state (UI-3). Mirrors the
// editor's container and row geometry; aria-hidden; reduced-motion
// safe via the skeleton primitives.

import { Skeleton, SkeletonCard, SkeletonText } from '@/components/ui/skeleton'

export default function CustomizeLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <SkeletonText lines={1} className="w-72" />
      </div>
      <div className="space-y-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  )
}
