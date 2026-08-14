import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS — SectionHeader primitive (UI-1B)
// Domain-blind in-page/in-card section heading: heading text
// (caller-controlled level), optional description, optional action
// slot, compact and normal spacing modes. Server-compatible; no
// business copy or data awareness.
// ============================================================

export function SectionHeader({
  title,
  description,
  action,
  as: Heading = 'h2',
  spacing = 'normal',
  className,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  /** Right-aligned slot (e.g. a "View all" link). */
  action?: React.ReactNode
  /** Heading level is the CALLER's responsibility — pick the level
   *  that fits the surrounding document outline. */
  as?: 'h2' | 'h3' | 'h4'
  spacing?: 'normal' | 'compact'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline justify-between',
        spacing === 'compact' ? 'gap-x-3 gap-y-0.5' : 'gap-x-3 gap-y-1',
        className
      )}
    >
      <div className="min-w-0">
        <Heading className="text-section-title text-ink">{title}</Heading>
        {description && (
          <p className={cn('text-support', spacing === 'compact' ? 'mt-0' : 'mt-0.5')}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-3">{action}</div>}
    </div>
  )
}
