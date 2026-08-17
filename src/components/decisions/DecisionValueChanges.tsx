import { ArrowRight, ChevronRight } from 'lucide-react'
import { MAIN_GOAL_OPTIONS } from '@/lib/constants'

// ============================================================
// UI-6C hosted-QA correction — human-readable decision diffs.
//
// The expanded DecisionCard previously printed the raw JSON audit
// payloads (`previous_value` / `new_value`) as the DEFAULT view:
// braces, quoted keys, and internal field names like `protein_g`.
// This module renders the same stored audit data as a concise
// change list instead — presentation only. The stored payloads,
// every lifecycle mutation, and the endpoints are untouched.
//
// Honesty rules:
//   - only fields whose values ACTUALLY changed are listed;
//   - only fields this registry can translate confidently are
//     listed — everything else stays available, untouched, behind
//     the collapsed "Technical details" disclosure (never invented
//     labels, never silently dropped);
//   - null/absent renders as "Not set" (missing is never zero);
//   - identical snapshots say so instead of showing empty boxes.
// ============================================================

// Every previous_value/new_value key any repository code path writes
// today (nutrition page, onboarding, profile page, migration 013
// RPC). Registry order IS the stable display order.
const FIELD_REGISTRY: ReadonlyArray<{
  key: string
  label: string
  format: (value: unknown) => string | null
}> = [
  { key: 'calories', label: 'Calorie target', format: (v) => formatNumber(v, 'cal') },
  { key: 'protein_g', label: 'Protein target', format: (v) => formatNumber(v, 'g') },
  { key: 'carbs_g', label: 'Carbohydrate target', format: (v) => formatNumber(v, 'g') },
  { key: 'fat_g', label: 'Fat target', format: (v) => formatNumber(v, 'g') },
  {
    key: 'cadence',
    label: 'Weigh-in schedule',
    format: (v) =>
      typeof v === 'string'
        ? ({ weekly: 'Weekly', biweekly: 'Every two weeks', manual: 'Manual' }[v] ?? v)
        : null,
  },
  { key: 'step_goal', label: 'Step goal', format: (v) => formatNumber(v, 'steps') },
  { key: 'fasting_goal_hours', label: 'Fasting goal', format: (v) => formatNumber(v, 'hours') },
  {
    key: 'main_goal',
    label: 'Main goal',
    format: (v) =>
      typeof v === 'string'
        ? (MAIN_GOAL_OPTIONS.find((o) => o.value === v)?.label ?? v)
        : null,
  },
]

function formatNumber(value: unknown, unit: string): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return `${value.toLocaleString('en-US')} ${unit}`
}

export interface DecisionDiffRow {
  key: string
  label: string
  before: string
  after: string
}

export interface DecisionDiff {
  /** Known fields whose values actually changed, in registry order. */
  rows: DecisionDiffRow[]
  /** True when a DIFFERING value exists that the registry cannot
   * translate confidently (unknown key, nested object/array, or an
   * unexpected value type) — the raw payload disclosure must appear. */
  hasUntranslated: boolean
  /** True when both snapshots are fully translatable and contain no
   * actual differences. */
  identical: boolean
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

const sameValue = (a: unknown, b: unknown): boolean =>
  JSON.stringify(a ?? null) === JSON.stringify(b ?? null)

/** Pure formatter: builds the human-readable diff between the stored
 * audit snapshots. Deterministic — output order is registry order. */
export function buildDecisionDiff(previous: unknown, next: unknown): DecisionDiff {
  const prevObj = isPlainObject(previous) ? previous : null
  const nextObj = isPlainObject(next) ? next : null

  // A non-object, non-null payload on either side cannot be
  // translated per-field at all.
  const shapeUntranslatable =
    (previous != null && prevObj === null) || (next != null && nextObj === null)
  if (shapeUntranslatable) {
    return { rows: [], hasUntranslated: !sameValue(previous, next), identical: sameValue(previous, next) }
  }

  const rows: DecisionDiffRow[] = []
  let hasUntranslated = false
  const knownKeys = new Set(FIELD_REGISTRY.map((f) => f.key))
  const allKeys = new Set([...Object.keys(prevObj ?? {}), ...Object.keys(nextObj ?? {})])

  for (const field of FIELD_REGISTRY) {
    if (!allKeys.has(field.key)) continue
    const before = prevObj?.[field.key]
    const after = nextObj?.[field.key]
    if (sameValue(before, after)) continue
    const beforeText = before == null ? 'Not set' : field.format(before)
    const afterText = after == null ? 'Not set' : field.format(after)
    if (beforeText === null || afterText === null) {
      // Known key carrying a value the formatter cannot render
      // confidently (e.g. a nested object) — audit path only.
      hasUntranslated = true
      continue
    }
    rows.push({ key: field.key, label: field.label, before: beforeText, after: afterText })
  }

  Array.from(allKeys).forEach((key) => {
    if (knownKeys.has(key)) return
    if (!sameValue(prevObj?.[key], nextObj?.[key])) hasUntranslated = true
  })

  return { rows, hasUntranslated, identical: rows.length === 0 && !hasUntranslated }
}

/** Expanded-card presentation of the audit snapshots. The raw JSON is
 * NEVER the default view — it appears only inside the collapsed
 * "Technical details" disclosure, and only when a change exists that
 * the friendly list cannot express. */
export function DecisionValueChanges({
  previous,
  next,
}: {
  previous: unknown
  next: unknown
}) {
  const diff = buildDecisionDiff(previous, next)
  return (
    <div className="space-y-2 text-xs">
      {diff.rows.length > 0 && (
        <dl className="space-y-1.5">
          {diff.rows.map((row) => (
            <div key={row.key} className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <dt className="font-medium text-ink">{row.label}</dt>
              <dd className="flex min-w-0 flex-wrap items-center gap-1 text-ink-muted">
                {/* overflow-wrap:anywhere (unlike break-word) also
                    constrains the flex item's intrinsic min-content
                    width, so an unbroken long value can never force
                    horizontal overflow at 320px. */}
                <span className="sr-only">Before: </span>
                <span className="break-words [overflow-wrap:anywhere]">{row.before}</span>
                <ArrowRight className="w-3 h-3 flex-shrink-0" aria-hidden="true" />
                <span className="sr-only">After: </span>
                <span className="break-words [overflow-wrap:anywhere] font-medium text-ink">{row.after}</span>
              </dd>
            </div>
          ))}
        </dl>
      )}
      {diff.identical && (
        <p className="text-ink-muted">No value changes were recorded.</p>
      )}
      {diff.hasUntranslated && (
        <details className="group">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1 text-xs font-medium text-ink-muted hover:text-ink [&::-webkit-details-marker]:hidden">
            <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" aria-hidden="true" />
            Technical details
          </summary>
          <div className="mt-1 space-y-2">
            {previous != null && (
              <div className="rounded bg-surface-sunken px-2 py-1.5">
                <p className="mb-1 text-ink-muted">Before</p>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-ink">
                  {JSON.stringify(previous, null, 2)}
                </pre>
              </div>
            )}
            {next != null && (
              <div className="rounded border border-brand/20 bg-brand-subtle/40 px-2 py-1.5">
                <p className="mb-1 text-ink-muted">After</p>
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-ink">
                  {JSON.stringify(next, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
