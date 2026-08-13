// ============================================================
// ForgeFitOS — Today widget contract (Phase 4B.3)
//
// Phase 4C will add dashboard customization + persistence. This
// phase deliberately does NOT — no settings, no drag-and-drop, no
// stored layout. What it does do is give every Today domain section
// a stable widget identity so a future widget configuration can map
// onto the existing structure without another restructuring pass.
//
// The wrapper is intentionally thin: a div carrying data-widget with
// the stable id. No state, no persistence, no client behavior.
// ============================================================

export type TodayWidgetId =
  | 'workout'
  | 'nutrition'
  | 'weight'
  | 'steps'
  | 'fasting'
  | 'decisions'
  | 'energy' // Phase 5B.3: the Energy Balance widget

export function TodayWidget({
  id,
  className,
  children,
}: {
  id: TodayWidgetId
  className?: string
  children: React.ReactNode
}) {
  return (
    <div data-widget={id} className={className}>
      {children}
    </div>
  )
}
