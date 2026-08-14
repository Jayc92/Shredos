// ============================================================
// ForgeFitOS — Dashboard preferences (UI-3)
// ============================================================
// The canonical, versioned Today-widget preference contract: which
// widgets render, in what order (array order IS the order — no
// redundant numeric field), and at what size. One pure normalizer
// guards BOTH reads and writes: stored JSON and browser-submitted
// JSON are equally untrusted.
//
// Boundaries:
//   - the page header and the primary workout action are NOT
//     widgets — they are page chrome; the workout hero shows only
//     workout information, so a workout-only dashboard (everything
//     else disabled) exposes nothing from hidden widgets
//   - the fasting WIDGET preference can hide fasting, but can never
//     enable the capability when profile.fasting_enabled is false —
//     visibleDashboardWidgets() applies that product gate
//   - all ten widgets are independently disableable (including
//     Coach); an all-disabled dashboard is valid and Today renders
//     a recovery state with the Edit layout action
// ============================================================

import type { TodayWidgetId } from '@/components/dashboard/TodayWidget'

export type DashboardWidgetSize = 'full' | 'half' | 'compact'

export interface DashboardWidgetPreference {
  id: TodayWidgetId
  enabled: boolean
  size: DashboardWidgetSize
}

export interface DashboardPreferencesV1 {
  version: 1
  widgets: DashboardWidgetPreference[]
}

/** Canonical widget order — the UI-2 default composition flattened
 *  into the preference-driven 12-column grid. */
export const DASHBOARD_WIDGET_IDS = [
  'calories',
  'protein',
  'steps',
  'weight',
  'nutrition',
  'workout',
  'energy',
  'fasting',
  'coach',
  'decisions',
] as const satisfies readonly TodayWidgetId[]

export const DASHBOARD_WIDGET_LABELS: Record<(typeof DASHBOARD_WIDGET_IDS)[number], string> = {
  calories: 'Calories',
  protein: 'Protein',
  steps: 'Steps',
  weight: 'Weight trend',
  nutrition: 'Nutrition details',
  workout: 'Workout status',
  energy: 'Energy balance',
  fasting: 'Fasting',
  coach: 'Training coach',
  decisions: 'Latest decision',
}

/** Sizes each widget can honestly support. Weight needs at least a
 *  half row for the readings chart to stay readable; Energy must not
 *  compress enough to hide evidence quality, complete-day counts,
 *  target context, or the no-eat-back framing — so neither offers
 *  compact. Everything else adapts honestly to a third of the row. */
export const DASHBOARD_WIDGET_SIZES: Record<
  (typeof DASHBOARD_WIDGET_IDS)[number],
  readonly DashboardWidgetSize[]
> = {
  calories: ['compact', 'half', 'full'],
  protein: ['compact', 'half', 'full'],
  steps: ['compact', 'half', 'full'],
  weight: ['half', 'full'],
  nutrition: ['compact', 'half', 'full'],
  workout: ['compact', 'half', 'full'],
  energy: ['half', 'full'],
  fasting: ['compact', 'half', 'full'],
  coach: ['compact', 'half', 'full'],
  decisions: ['compact', 'half', 'full'],
}

const DEFAULT_SIZES: Record<(typeof DASHBOARD_WIDGET_IDS)[number], DashboardWidgetSize> = {
  calories: 'compact',
  protein: 'compact',
  steps: 'compact',
  weight: 'full',
  nutrition: 'half',
  workout: 'half',
  energy: 'half',
  fasting: 'half',
  coach: 'half',
  decisions: 'half',
}

/** The canonical default: every widget enabled, UI-2-equivalent
 *  composition (three compact tiles, full-width weight feature,
 *  half-width pairs). Frozen so no caller can mutate the source. */
export const DEFAULT_DASHBOARD_PREFS: DashboardPreferencesV1 = Object.freeze({
  version: 1 as const,
  widgets: Object.freeze(
    DASHBOARD_WIDGET_IDS.map((id) =>
      Object.freeze({ id, enabled: true, size: DEFAULT_SIZES[id] })
    )
  ) as unknown as DashboardWidgetPreference[],
})

const VALID_SIZES: readonly string[] = ['full', 'half', 'compact']

/**
 * Normalize ANY input (stored JSON, browser-submitted JSON, null,
 * garbage) into a complete valid V1 document. Never throws; never
 * mutates the input; deterministic.
 *   - null / non-object / unsupported version -> canonical defaults
 *   - unknown widget ids ignored; duplicates keep the FIRST entry
 *   - enabled must be a real boolean (else that widget's default)
 *   - size must be in the enum AND supported by the widget (else
 *     that widget's default size)
 *   - valid user order preserved; widgets missing from the stored
 *     list (e.g. a future widget added after the user saved) are
 *     restored with defaults, appended in canonical order
 */
export function normalizeDashboardPrefs(input: unknown): DashboardPreferencesV1 {
  const fallback = (): DashboardPreferencesV1 => ({
    version: 1,
    widgets: DASHBOARD_WIDGET_IDS.map((id) => ({ id, enabled: true, size: DEFAULT_SIZES[id] })),
  })

  if (typeof input !== 'object' || input === null || Array.isArray(input)) return fallback()
  const doc = input as Record<string, unknown>
  if (doc.version !== 1) return fallback()
  if (!Array.isArray(doc.widgets)) return fallback()

  const known = new Set<string>(DASHBOARD_WIDGET_IDS)
  const seen = new Set<string>()
  const widgets: DashboardWidgetPreference[] = []

  for (const raw of doc.widgets) {
    if (typeof raw !== 'object' || raw === null) continue
    const w = raw as Record<string, unknown>
    const id = typeof w.id === 'string' ? w.id : null
    if (id === null || !known.has(id) || seen.has(id)) continue
    seen.add(id)
    const cid = id as (typeof DASHBOARD_WIDGET_IDS)[number]
    const enabled = typeof w.enabled === 'boolean' ? w.enabled : true
    const size =
      typeof w.size === 'string' &&
      VALID_SIZES.includes(w.size) &&
      DASHBOARD_WIDGET_SIZES[cid].includes(w.size as DashboardWidgetSize)
        ? (w.size as DashboardWidgetSize)
        : DEFAULT_SIZES[cid]
    widgets.push({ id: cid, enabled, size })
  }

  // Restore missing canonical widgets with defaults, appended in
  // canonical order — a future widget missing from a stored V1 shows
  // up rather than silently vanishing forever.
  for (const id of DASHBOARD_WIDGET_IDS) {
    if (!seen.has(id)) widgets.push({ id, enabled: true, size: DEFAULT_SIZES[id] })
  }

  return { version: 1, widgets }
}

/**
 * The widgets Today actually renders, in order: enabled AND allowed
 * by product capability. The fasting preference can hide the widget
 * but can never reveal it when profile fasting is disabled.
 */
export function visibleDashboardWidgets(
  prefs: DashboardPreferencesV1,
  fastingEnabled: boolean
): DashboardWidgetPreference[] {
  return prefs.widgets.filter(
    (w) => w.enabled && (w.id !== 'fasting' || fastingEnabled)
  )
}

/** Responsive span classes per size. Mobile (below sm) is always one
 *  widget per row via the grid's grid-cols-1 base; sm gets a
 *  deliberate two-column tier; desktop is the 12-column contract:
 *  full=12, half=6, compact=4. */
export function dashboardSpanClasses(size: DashboardWidgetSize): string {
  switch (size) {
    case 'full':
      return 'sm:col-span-2 lg:col-span-12'
    case 'half':
      return 'sm:col-span-1 lg:col-span-6'
    case 'compact':
      return 'sm:col-span-1 lg:col-span-4'
  }
}
