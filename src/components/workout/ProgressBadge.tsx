import { cn } from '@/lib/utils'
import { MoveRight, TrendingDown, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { progressLabel, progressColor } from '@/lib/workout'
import type { ProgressSignal } from '@/types/app'

interface ProgressBadgeProps {
  signal: ProgressSignal
  previousSummary?: string
}

// UI-6C badge correction: lib/workout's progressColor returns legacy
// literal palette composites, but Tailwind scans only src/app,
// src/components, and src/pages — never src/lib — so those utilities
// are not in the compiled stylesheet and the chips rendered with
// transparent backgrounds/borders. This SCANNED consumer maps the
// helper's result to the semantic tokens the stylesheet ships, keyed
// on the hue word of the FIRST class token so no dead literal
// reappears anywhere in this file. Helper call and signal meaning
// untouched.
const SIGNAL_TOKEN: Record<string, string> = {
  green: 'bg-success-subtle text-success border-success/20',
  red: 'bg-critical-subtle text-critical border-critical/20',
  blue: 'bg-info-subtle text-info border-info/20',
  secondary: 'bg-surface-sunken text-ink-muted border-edge',
}
const signalBadgeClass = (signal: ProgressSignal): string =>
  SIGNAL_TOKEN[progressColor(signal).split(' ')[0].split('-')[1]] ?? 'bg-surface-sunken text-ink border-edge'

// UI-7: progressLabel's returned strings carry direction glyphs
// (e.g. 'Improved' prefixed by an up glyph); this SCANNED consumer maps each signal to the
// SAME wording with an aria-hidden Lucide icon instead — matching
// the Weekly Review and Progress overview StatusBadges. The lib
// helper stays byte-untouched and remains the fallback for any
// signal this map does not know.
const SIGNAL_META: Record<string, { label: string; Icon: LucideIcon | null }> = {
  improved: { label: 'Improved', Icon: TrendingUp },
  declined: { label: 'Declined', Icon: TrendingDown },
  same: { label: 'Same', Icon: MoveRight },
  new: { label: 'New exercise', Icon: null },
}

export function ProgressBadge({ signal, previousSummary }: ProgressBadgeProps) {
  const meta = SIGNAL_META[signal]
  return (
    <span
      title={previousSummary ? `Previous: ${previousSummary}` : undefined}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        signalBadgeClass(signal)
      )}
    >
      {meta?.Icon && <meta.Icon className="w-3 h-3" aria-hidden="true" />}
      {meta ? meta.label : progressLabel(signal)}
    </span>
  )
}
