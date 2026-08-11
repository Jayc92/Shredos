'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DRINK_PRESETS, computeDrinkLogPayload } from '@/lib/drinks'
import { Card, CardContent } from '@/components/ui/card'

interface QuickDrinkLogProps {
  date: string
}

const MAX_QUANTITY = 24

export function QuickDrinkLog({ date }: QuickDrinkLogProps) {
  const router = useRouter()
  const [presetId, setPresetId] = useState(DRINK_PRESETS[0].id)
  const [quantity, setQuantity] = useState('1')
  const [customName, setCustomName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const selectedPreset = DRINK_PRESETS.find((p) => p.id === presetId) ?? DRINK_PRESETS[0]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const qty = parseInt(quantity, 10)
    if (!quantity || isNaN(qty) || qty < 1 || qty > MAX_QUANTITY) {
      setError(`Enter a quantity between 1 and ${MAX_QUANTITY}.`)
      return
    }

    setSaving(true)

    const payload = computeDrinkLogPayload(selectedPreset, qty, customName, date)

    const res = await fetch('/api/food-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body.error ?? 'Failed to log drink.')
      return
    }

    setSuccess(true)
    setQuantity('1')
    setCustomName('')
    router.refresh()
  }

  return (
    <Card variant="subtle" className="gap-0 py-4">
      <CardContent>
      <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-semibold text-ink">Quick drink log</h2>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-2">
        {DRINK_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setPresetId(preset.id)}
            aria-pressed={presetId === preset.id}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              presetId === preset.id
                ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-sm'
                : 'border-border bg-background text-ink hover:bg-muted'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Quantity</label>
          <input
            type="number"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min={1}
            max={MAX_QUANTITY}
            step={1}
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-ink focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">
            Name{' '}
            <span className="text-ink-muted font-normal text-xs">(optional)</span>
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. Bud Light"
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-ink-muted">
        Estimates vary by brand and pour size.
      </p>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {success && (
        <p className="text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
          ✓ Drink logged.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {saving ? 'Logging…' : 'Log drink'}
      </button>
    </form>
      </CardContent>
    </Card>
  )
}
