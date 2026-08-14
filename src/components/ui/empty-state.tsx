import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS — EmptyState primitive (UI-1B)
// Domain-blind empty/none-yet block. Server component. Renders
// EXACTLY the caller's copy — no fabricated encouragement, no
// diagnostic guesses, no default strings.
//
// compact mode reproduces the app's established inline convention
// (muted one-line title + optional muted support line) byte-for-
// byte, so adopting it for an existing inline empty state changes
// neither copy nor geometry. standard mode is the centered block
// (icon slot, title, description, action) for UI-2's larger empty
// surfaces. Reading order is icon → title → description → action
// in both DOM and visual order.
// ============================================================

export function EmptyState({
  icon,
  title,
  description,
  action,
  mode = 'standard',
  className,
}: {
  /** Decorative icon slot (caller sizes it); hidden from AT here. */
  icon?: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  mode?: 'standard' | 'compact'
  className?: string
}) {
  if (mode === 'compact') {
    return (
      <div className={cn('space-y-1', className)}>
        <p className="text-sm text-ink-muted">{title}</p>
        {description && <p className="text-xs text-ink-muted">{description}</p>}
        {action}
      </div>
    )
  }
  return (
    <div className={cn('flex flex-col items-center gap-2 py-8 text-center', className)}>
      {icon && (
        <div aria-hidden="true" className="text-ink-muted">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="text-support max-w-sm">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
