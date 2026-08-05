import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================
// ForgeFitOS FilterChip (Phase 4B.1)
// Shared selectable chip for filter rows and segmented choices.
// Selection is NEVER color-only: selected chips gain a check glyph,
// a stronger border, and heavier weight. Rows of chips should wrap
// on desktop and may horizontally scroll on mobile (overflow-x-auto
// with an edge-fade affordance — see phase notes). Route-level
// filter rows migrate to this primitive in 4B.3+.
// ============================================================

export function FilterChip({
  selected,
  onClick,
  count,
  className,
  children,
}: {
  selected: boolean
  onClick: () => void
  count?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))]',
        selected
          ? 'border border-[hsl(var(--brand))] bg-[hsl(var(--surface-selected))] font-semibold text-foreground'
          : 'border border-[hsl(var(--border-subtle))] bg-[hsl(var(--surface))] font-medium text-muted-foreground hover:text-foreground'
      )}
    >
      {selected && <Check className="size-3" aria-hidden="true" />}
      {children}
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-[hsl(var(--brand-subtle))] px-1.5 py-0.5 text-[10px] text-[hsl(var(--brand))]">
          {count}
        </span>
      )}
    </button>
  )
}
