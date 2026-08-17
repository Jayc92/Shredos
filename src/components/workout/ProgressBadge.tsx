import { cn } from '@/lib/utils'
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

export function ProgressBadge({ signal, previousSummary }: ProgressBadgeProps) {
  return (
    <span
      title={previousSummary ? `Previous: ${previousSummary}` : undefined}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        signalBadgeClass(signal)
      )}
    >
      {progressLabel(signal)}
    </span>
  )
}
