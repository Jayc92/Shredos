'use client'

/**
 * OptionCard  — full-width selectable row with radio dot + checkmark
 * OptionCardCompact — 3-column compact tile with corner badge
 * OptionPill  — small inline toggle (dietary prefs, tags)
 *
 * Selected state is unambiguous in any theme:
 *   • 2px primary border  (vs 1px neutral)
 *   • bg-primary/20 tint  (not /10)
 *   • Filled green dot with white checkmark (OptionCard)
 *   • Corner badge (OptionCardCompact)
 *   • Solid fill + checkmark (OptionPill)
 *   • aria-pressed on every button
 *   • focus-visible ring
 */

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Full-width card ───────────────────────────────────────────────

export function OptionCard({
  selected,
  onClick,
  label,
  description,
  className,
}: {
  selected: boolean
  onClick: () => void
  label: string
  description?: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'w-full text-left rounded-xl px-4 py-3 transition-all duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-2 border-primary bg-primary/20 text-foreground'
          : 'border border-border bg-card text-foreground hover:border-muted-foreground/60 hover:bg-muted/40',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Radio dot */}
        <span
          aria-hidden
          className={cn(
            'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
            selected ? 'border-primary bg-primary' : 'border-muted-foreground/50'
          )}
        >
          {selected && (
            <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />
          )}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{label}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  )
}

// ── Compact grid tile (3-col) ─────────────────────────────────────

export function OptionCardCompact({
  selected,
  onClick,
  label,
  description,
}: {
  selected: boolean
  onClick: () => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'relative text-center rounded-xl px-3 py-3 transition-all duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-2 border-primary bg-primary/20 text-foreground'
          : 'border border-border bg-card text-foreground hover:border-muted-foreground/60 hover:bg-muted/40'
      )}
    >
      {selected && (
        <span
          aria-hidden
          className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-2.5 h-2.5 text-primary-foreground" strokeWidth={3} />
        </span>
      )}
      <p className={cn('text-xs font-semibold', selected ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </p>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </button>
  )
}

// ── Inline pill ───────────────────────────────────────────────────

export function OptionPill({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:text-foreground hover:border-muted-foreground/60'
      )}
    >
      {selected && <Check className="w-3 h-3 flex-shrink-0" strokeWidth={3} />}
      {children}
    </button>
  )
}
