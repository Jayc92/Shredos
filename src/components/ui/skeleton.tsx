import * as React from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS Skeleton primitives (Phase 4B.1)
// Calm opacity pulse (globals.css .skeleton), honors
// prefers-reduced-motion, approximates final geometry to avoid
// layout shift. Use instead of "Loading..." text or emoji/spinner
// placeholders; Spinner exists only for genuinely indeterminate
// inline waits (e.g. inside a loading button).
// ============================================================

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div aria-hidden="true" className={cn('skeleton', className)} {...props} />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('space-y-2', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className={cn('skeleton-text', i === lines - 1 && 'w-3/5')} />
      ))}
    </div>
  )
}

export function SkeletonMetric({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('space-y-2', className)}>
      <div className="skeleton h-3 w-20" />
      <div className="skeleton-metric" />
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('skeleton-card', className)} />
}

/** Section-level page skeleton: a title line plus stacked cards. */
export function SkeletonSection({ cards = 2, className }: { cards?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('space-y-3', className)}>
      <div className="skeleton h-4 w-32" />
      {Array.from({ length: cards }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
