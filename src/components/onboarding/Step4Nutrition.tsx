'use client'

import { useState } from 'react'
import { calculateNutritionTargets } from '@/lib/nutrition'
import { parseFloat2 } from '@/lib/units'
import { DEFAULT_DEFICIT } from '@/lib/constants'
import type { OnboardingFormState } from '@/types/app'

interface Step4Props {
  form: OnboardingFormState
  update: (patch: Partial<OnboardingFormState>) => void
  onBack: () => void
  onComplete: (deficitOverride?: number) => void
  saving: boolean
}

export function Step4Nutrition({ form, update, onBack, onComplete, saving }: Step4Props) {
  const [deficitSlider, setDeficitSlider] = useState(
    form.deficit_override ? parseInt(form.deficit_override) : DEFAULT_DEFICIT
  )

  const weightLbs = parseFloat2(form.weight_lbs)
  const bfPct = parseFloat2(form.bf_pct)

  const nutrition = weightLbs
    ? calculateNutritionTargets({
        weightLbs,
        bfPct: bfPct ?? undefined,
        sex: form.sex || null,
        activityLevel: form.activity_level as 'sedentary' | 'moderately_active' | 'very_active',
        goal: form.main_goal as 'fat_loss' | 'muscle_gain' | 'strength' | 'recomposition' | 'maintenance' | 'running',
        deficitOverride: deficitSlider,
      })
    : null

  function handleDeficitChange(val: number) {
    setDeficitSlider(val)
    update({ deficit_override: String(val) })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-ink">Review your nutrition targets</h2>
        <p className="text-sm text-ink-muted mt-0.5">
          Calculated from your profile. You can adjust below.
        </p>
      </div>

      {!weightLbs ? (
        <div className="bg-caution-subtle rounded-lg px-4 py-3">
          <p className="text-sm text-caution">
            You did not enter a current weight. Go back to Step 1 to add it, or continue without
            nutrition targets.
          </p>
        </div>
      ) : nutrition ? (
        <>
          {/* Calculation breakdown */}
          <div className="bg-surface-sunken rounded-lg p-4 space-y-2 text-sm">
            <p className="text-ink-muted">
              <span className="text-ink font-medium">{weightLbs} lbs</span> ×{' '}
              <span className="text-ink font-medium">{nutrition.multiplier_used}</span>{' '}
              (
              {form.activity_level === 'sedentary'
                ? 'sedentary'
                : form.activity_level === 'moderately_active'
                ? 'moderate activity'
                : 'very active'}
              ) ={' '}
              <span className="text-ink font-medium">
                {nutrition.maintenance_cal.toLocaleString()} cal maintenance
              </span>
            </p>
            {nutrition.deficit !== 0 && (
              <p className="text-ink-muted">
                Minus{' '}
                <span className="text-ink font-medium">
                  {Math.abs(nutrition.deficit)} cal{' '}
                  {nutrition.deficit > 0 ? 'deficit' : 'surplus'}
                </span>{' '}
                ={' '}
                <span className="text-brand font-semibold">
                  {nutrition.calories.toLocaleString()} cal/day
                </span>
              </p>
            )}
            <p className="text-xs text-ink-muted pt-1 border-t border-edge-subtle">
              Protein basis: {nutrition.protein_basis === 'lean_mass' ? 'lean body mass' : 'total bodyweight'}
            </p>
          </div>

          {/* Macro targets */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Calories', value: nutrition.calories.toLocaleString(), unit: 'cal/day', color: 'text-brand' },
              { label: 'Protein', value: String(nutrition.protein_g), unit: 'g/day', color: 'text-ink' },
              { label: 'Carbs', value: String(nutrition.carbs_g), unit: 'g/day', color: 'text-ink' },
              { label: 'Fat min', value: String(nutrition.fat_g), unit: 'g/day', color: 'text-ink' },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="bg-surface-sunken rounded-lg px-4 py-3">
                <p className="metric-label">{label}</p>
                <p className={`text-2xl font-bold tabular-nums mt-1 ${color}`}>{value}</p>
                <p className="text-xs text-ink-muted">{unit}</p>
              </div>
            ))}
          </div>

          {/* Guardrail warnings */}
          {nutrition.warnings.length > 0 && (
            <div className="space-y-2">
              {nutrition.warnings.map((w, i) => (
                <div
                  key={i}
                  className="bg-caution-subtle rounded-lg px-4 py-3"
                >
                  <p className="text-xs text-caution leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          )}

          {/* Deficit adjuster (only for fat loss / recomposition) */}
          {(form.main_goal === 'fat_loss' || form.main_goal === 'recomposition') && (
            <div className="space-y-2 pt-2 border-t border-edge-subtle">
              <label className="block text-sm font-medium text-ink">
                Daily deficit:{' '}
                <span className="text-brand">{deficitSlider} cal</span>
              </label>
              <input
                type="range"
                min="200"
                max="700"
                step="50"
                value={deficitSlider}
                onChange={(e) => handleDeficitChange(parseInt(e.target.value))}
                className="w-full accent-[hsl(var(--brand))]"
              />
              <div className="flex justify-between text-xs text-ink-muted">
                <span>200 (slow)</span>
                <span>450 (default)</span>
                <span>700 (aggressive)</span>
              </div>
              <p className="text-xs text-ink-muted">
                ~{Math.round(deficitSlider / 3500 * 7 * 10) / 10} lbs/week expected loss.
                Larger deficits carry more muscle loss risk.
              </p>
            </div>
          )}
        </>
      ) : null}

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={saving}
          className="py-3 rounded-lg border border-edge text-ink-muted font-medium text-sm hover:bg-surface-sunken transition-colors disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={() => onComplete(deficitSlider !== DEFAULT_DEFICIT ? deficitSlider : undefined)}
          disabled={saving}
          className="py-3 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Start tracking →'}
        </button>
      </div>

      <p className="text-xs text-center text-ink-muted">
        You can edit all targets anytime from your profile or nutrition page.
      </p>
    </div>
  )
}
