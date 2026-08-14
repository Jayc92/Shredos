import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS — PageHeader primitive (UI-1B)
// Domain-blind page-title block: title (caller-controlled heading
// level), optional eyebrow, optional description, optional action
// slot. Server-compatible; renders exactly what the caller passes —
// no business copy, no data fetching, no route awareness. Uses the
// UI-1A typography roles so every page title shares one scale.
// ============================================================

export function PageHeader({
  title,
  eyebrow,
  description,
  action,
  as: Heading = 'h1',
  className,
}: {
  title: React.ReactNode
  /** Small uppercase kicker above the title. */
  eyebrow?: React.ReactNode
  description?: React.ReactNode
  /** Right-aligned slot (links, buttons); stacks under the title on
   *  narrow screens via flex-wrap. */
  action?: React.ReactNode
  /** Heading level is the CALLER's responsibility — default h1 for
   *  route pages; pass 'h2' when composing inside another page. */
  as?: 'h1' | 'h2'
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-2', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-label mb-1">{eyebrow}</p>}
        <Heading className="text-page-title text-ink">{title}</Heading>
        {description && <p className="text-support mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-4">{action}</div>}
    </div>
  )
}
