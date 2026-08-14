'use client'

// ============================================================
// ForgeFitOS — Dashboard customization editor (UI-3)
//
// Client editor over the normalized V1 preference document. All
// edits are LOCAL DRAFT STATE: Save is the only path to
// persistence (explicit PUT), Cancel navigates away untouched, and
// Reset to default only replaces the draft (it persists nothing by
// itself). A failed save keeps the editor open with the draft
// intact and a retryable error.
//
// Reordering: accessible move-up / move-down buttons — the option-1
// interaction from the UI-3 evaluation. They work identically with
// keyboard, screen reader, touch, and mouse, need no dependency,
// and avoid the fake-drag-handle trap (we show NO drag affordance
// because none exists). Row order in the list IS the saved order.
//
// Fasting: the preference stays editable (it is just a preference),
// but when the profile capability is off the row explains that the
// widget stays hidden until fasting is enabled in the profile — a
// dashboard preference can never switch the capability on.
//
// Unsaved-changes note: no global navigation interception exists in
// this architecture; rather than fragile beforeunload work, Cancel
// is explicit and the header states that changes apply on Save.
// ============================================================

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowDown, ArrowUp, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/ui/page-header'
import { Switch } from '@/components/ui/switch'
import {
  DASHBOARD_WIDGET_LABELS,
  DASHBOARD_WIDGET_SIZES,
  DEFAULT_DASHBOARD_PREFS,
  normalizeDashboardPrefs,
  type DashboardPreferencesV1,
  type DashboardWidgetPreference,
  type DashboardWidgetSize,
} from '@/lib/dashboard-prefs'

const SIZE_LABELS: Record<DashboardWidgetSize, string> = {
  full: 'Full',
  half: 'Half',
  compact: 'Compact',
}

export function CustomizeDashboardClient({
  initialPrefs,
  fastingEnabled,
}: {
  initialPrefs: DashboardPreferencesV1
  fastingEnabled: boolean
}) {
  const router = useRouter()
  const [widgets, setWidgets] = useState<DashboardWidgetPreference[]>(
    () => initialPrefs.widgets.map((w) => ({ ...w }))
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enabledCount = useMemo(() => widgets.filter((w) => w.enabled).length, [widgets])

  function move(index: number, delta: -1 | 1) {
    setWidgets((prev) => {
      const next = prev.map((w) => ({ ...w }))
      const target = index + delta
      if (target < 0 || target >= next.length) return prev
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  function setEnabled(index: number, enabled: boolean) {
    setWidgets((prev) => prev.map((w, i) => (i === index ? { ...w, enabled } : w)))
  }

  function setSize(index: number, size: DashboardWidgetSize) {
    setWidgets((prev) => prev.map((w, i) => (i === index ? { ...w, size } : w)))
  }

  function resetToDefault() {
    // Local draft only — persists when (and only when) Save is chosen.
    setWidgets(DEFAULT_DASHBOARD_PREFS.widgets.map((w) => ({ ...w })))
    setError(null)
  }

  async function save() {
    setSaving(true)
    setError(null)
    // Client-side normalization keeps the payload canonical; the
    // server re-normalizes regardless (untrusted input rule).
    const payload = normalizeDashboardPrefs({ version: 1, widgets })
    try {
      const res = await fetch('/api/dashboard-prefs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Could not save your layout. Please try again.')
        setSaving(false)
        return
      }
      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('Could not save your layout. Check your connection and try again.')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5 pb-4">
      <PageHeader
        title="Customize dashboard"
        description="Choose which widgets appear on Today, their order, and their size. Changes apply when you save."
      />

      {/* Widget rows — list order is display order. */}
      <ul className="space-y-2">
        {widgets.map((w, i) => {
          const sizes = DASHBOARD_WIDGET_SIZES[w.id]
          const fastingUnavailable = w.id === 'fasting' && !fastingEnabled
          return (
            <li key={w.id}>
              <Card variant="metric" className="gap-0 py-3">
                <CardContent className="space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      {/* Reorder controls: accessible buttons, 44px targets. */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => move(i, -1)}
                          disabled={i === 0}
                          aria-label={`Move ${DASHBOARD_WIDGET_LABELS[w.id]} up`}
                          className="flex min-h-6 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-interactive hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowUp className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(i, 1)}
                          disabled={i === widgets.length - 1}
                          aria-label={`Move ${DASHBOARD_WIDGET_LABELS[w.id]} down`}
                          className="flex min-h-6 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-ink-muted transition-colors hover:bg-surface-interactive hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          <ArrowDown className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink">
                          {DASHBOARD_WIDGET_LABELS[w.id]}
                        </p>
                        <p className="text-xs text-ink-muted">Position {i + 1} of {widgets.length}</p>
                      </div>
                    </div>
                    <label className="flex min-h-11 items-center gap-2">
                      <span className="text-xs text-ink-muted">
                        {w.enabled ? 'Shown' : 'Hidden'}
                      </span>
                      <Switch
                        checked={w.enabled}
                        onCheckedChange={(v) => setEnabled(i, v === true)}
                        aria-label={`Show ${DASHBOARD_WIDGET_LABELS[w.id]} on Today`}
                      />
                    </label>
                  </div>

                  {/* Size choice — selection carried by border + weight +
                      aria-pressed, never color alone. Unsupported sizes
                      are absent by contract, not merely disabled. */}
                  <div className="flex items-center gap-1.5" role="group"
                    aria-label={`${DASHBOARD_WIDGET_LABELS[w.id]} size`}>
                    {sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSize(i, size)}
                        aria-pressed={w.size === size}
                        className={cn(
                          'min-h-9 rounded-[var(--radius-control)] border px-3 text-xs transition-colors',
                          w.size === size
                            ? 'border-brand bg-brand-subtle font-semibold text-ink'
                            : 'border-edge font-medium text-ink-muted hover:bg-surface-interactive'
                        )}
                      >
                        {SIZE_LABELS[size]}
                      </button>
                    ))}
                    {sizes.length < 3 && (
                      <span className="text-xs text-ink-muted">
                        Compact is unavailable — this widget needs room for its evidence.
                      </span>
                    )}
                  </div>

                  {fastingUnavailable && (
                    <p className="text-xs text-ink-muted">
                      Fasting is currently turned off in your profile, so this widget stays
                      hidden on Today even when shown here. Enable fasting in your profile
                      to use it.
                    </p>
                  )}
                </CardContent>
              </Card>
            </li>
          )
        })}
      </ul>

      {enabledCount === 0 && (
        <p className="text-xs text-ink-muted">
          Every widget is hidden — Today will show an empty dashboard with a shortcut back
          here. That is a valid layout (for example, workout-only users may hide everything
          else and keep just the workout widgets they want).
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-critical-subtle px-3 py-2 text-sm text-critical">
          {error}
        </p>
      )}

      {/* Actions: Save is the ONLY persistence path. */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] bg-brand px-5 text-sm font-semibold text-[hsl(var(--brand-foreground))] transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save layout'}
        </button>
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] border border-edge px-5 text-sm font-medium text-ink-secondary transition-colors hover:bg-surface-interactive hover:text-ink"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={resetToDefault}
          className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-control)] px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-interactive hover:text-ink"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Reset to default
        </button>
      </div>
    </div>
  )
}
