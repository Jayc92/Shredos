'use client'

import { useState, useEffect } from 'react'
import { localCalendarDayOf } from '@/lib/local-date'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateNutritionTargets } from '@/lib/nutrition'
import {
  buildNutritionTrendSummary,
  fetchNutritionTrendLogs,
} from '@/lib/nutrition-trends'
import type { RawFoodLogLike } from '@/lib/nutrition-trends'
import { NutritionTrendSection } from '@/components/nutrition/NutritionTrendSection'
import { FuelSubNav } from '@/components/food/FuelSubNav'
import { Card, CardContent } from '@/components/ui/card'
import { GoalAdjustmentReviewCard } from '@/components/nutrition/GoalAdjustmentReviewCard'
import { kgToLbs } from '@/lib/units'
import type { NutritionTarget, UserProfile } from '@/types/database'
// The client fetch state reuses the route's own loading.tsx composition,
// so the skeleton the router shows during navigation and the skeleton
// this page shows while its client query runs are byte-identical —
// never a bare text fallback (4B.6C QA correction).
import NutritionLoading from './loading'

// This page is client-side to support live recalculation
export default function NutritionPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [target, setTarget] = useState<NutritionTarget | null>(null)
  // Phase 2Z: raw rows for the trend summary/charts — fetched once in
  // the same load() batch below (bounded, RLS-scoped); all math is
  // pure and happens at render time.
  const [trendLogs, setTrendLogs] = useState<RawFoodLogLike[]>([])
  const [loading, setLoading] = useState(true)

  // Override fields
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: p }, { data: t }, logs] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', user.id).single(),
        supabase
          .from('nutrition_targets')
          .select('*')
          .eq('user_id', user.id)
          .lte('effective_date', localCalendarDayOf(new Date()))
          .order('effective_date', { ascending: false })
          .limit(1)
          .single(),
        // Phase 2Z: bounded trend fetch (latest logged date + the
        // 28-day window ending on it), same helper /progress uses.
        fetchNutritionTrendLogs(supabase, user.id),
      ])

      setProfile(p ?? null)
      setTarget(t ?? null)
      setTrendLogs(logs)

      if (t) {
        setCalories(String(t.calories))
        setProtein(String(t.protein_g))
        setCarbs(String(t.carbs_g))
        setFat(String(t.fat_g))
        setNotes(t.notes ?? '')
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSaveError(null)
    setSaveSuccess(false)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const cal = parseInt(calories)
    const pro = parseInt(protein)
    const carb = parseInt(carbs)
    const f = parseInt(fat)

    const today = localCalendarDayOf(new Date())
    const lowCarbWarning = carb < 75

    // Save new versioned nutrition target. The saved row rides back on
    // the same upsert request (.select().single() — no extra query) so
    // local state can be updated to the new authoritative target.
    const { data: savedTarget, error: targetError } = await supabase
      .from('nutrition_targets')
      .upsert({
        user_id: user.id,
        effective_date: today,
        calories: cal,
        protein_g: pro,
        carbs_g: carb,
        fat_g: f,
        low_carb_warning: lowCarbWarning,
        notes: notes || null,
      }, { onConflict: 'user_id,effective_date' })
      .select()
      .single()

    if (targetError) {
      setSaveError(targetError.message)
      setSaving(false)
      return
    }

    // Phase 2Z stale-state fix: the trend section derives its
    // protein-target adherence from this page's `target` state at
    // render time, but the save previously never updated that state —
    // so adherence kept using the pre-save target until a manual
    // reload (router.refresh() re-renders server components, not this
    // client page's useEffect state). The row saved with today's
    // effective_date IS the latest effective target — the same single
    // authority the initial load queries — so updating state from the
    // upsert's returned row recomputes the trend summary immediately,
    // with no food-log refetch and no second target source.
    if (savedTarget) {
      setTarget(savedTarget)
    }

    // Log decision
    await supabase.from('decision_logs').insert({
      user_id: user.id,
      decision_type: 'nutrition_targets_updated',
      decision_title: `Nutrition targets updated manually`,
      decision_summary: `Calories: ${cal}, Protein: ${pro}g, Carbs: ${carb}g, Fat: ${f}g`,
      reason: 'User manually updated nutrition targets.',
      previous_value: target ? {
        calories: target.calories,
        protein_g: target.protein_g,
        carbs_g: target.carbs_g,
        fat_g: target.fat_g,
      } : null,
      new_value: { calories: cal, protein_g: pro, carbs_g: carb, fat_g: f },
      status: 'applied',
      created_by: 'user',
      applied_at: new Date().toISOString(),
    })

    setSaving(false)
    setSaveSuccess(true)
    router.refresh()
  }

  if (loading) {
    return <NutritionLoading />
  }

  const weightLbs = profile?.current_weight_kg
    ? kgToLbs(profile.current_weight_kg)
    : null

  const calculated =
    weightLbs && profile
      ? calculateNutritionTargets({
          weightLbs,
          bfPct: profile.bf_pct ?? undefined,
          sex: profile.sex,
          activityLevel: profile.activity_level ?? 'moderately_active',
          goal: profile.main_goal ?? 'fat_loss',
        })
      : null

  // Phase 2Z: pure trend math over the fetched rows. Adherence uses
  // the SAME authoritative target this page already edits
  // (nutrition_targets.protein_g) — no new target formula.
  const trendSummary = buildNutritionTrendSummary(trendLogs, target?.protein_g ?? null)

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Nutrition targets</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Edit your daily targets. Each change is versioned and logged.
        </p>
      </div>

      <FuelSubNav />

      {/* Current authoritative target (4B.6C) — a display of the SAME
          already-fetched target the form below edits; the suggestion
          surfaces further down never visually replace these values
          before an explicit apply. */}
      {target && (
        <Card variant="elevated" className="gap-0 py-4">
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-semibold text-ink">Current target</h2>
              <span className="text-xs text-ink-muted">
                Effective {target.effective_date}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { label: 'Calories', value: target.calories.toLocaleString() },
                { label: 'Protein', value: `${target.protein_g}g` },
                { label: 'Carbs', value: `${target.carbs_g}g` },
                { label: 'Fat', value: `${target.fat_g}g` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-sunken rounded-lg py-3">
                  <p className="metric-label">{label}</p>
                  <p className="text-xl font-bold tabular-nums mt-1 text-ink">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase 3E: the ONE authoritative adjustment-review surface.
          Server-computed evidence, explicit user approval; a
          successful apply also updates this page's target state (the
          same stale-state pattern the 3D review-date fix uses). */}
      <GoalAdjustmentReviewCard
        onApplied={(newTarget) => {
          setTarget(newTarget)
          setCalories(String(newTarget.calories))
          setProtein(String(newTarget.protein_g))
          setCarbs(String(newTarget.carbs_g))
          setFat(String(newTarget.fat_g))
        }}
      />

      {/* Calculated suggestion */}
      {calculated && (
        <Card variant="subtle" className="gap-0 py-4">
          <CardContent className="space-y-3">
          <h3 className="text-sm font-medium text-ink">
            Calculated from profile
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {[
              { label: 'Calories', value: calculated.calories, color: 'text-primary' },
              { label: 'Protein', value: `${calculated.protein_g}g`, color: 'text-blue-400' },
              { label: 'Carbs', value: `${calculated.carbs_g}g`, color: 'text-yellow-400' },
              { label: 'Fat', value: `${calculated.fat_g}g`, color: 'text-orange-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-secondary rounded-lg py-3">
                <p className="metric-label">{label}</p>
                <p className={`text-xl font-bold tabular-nums mt-1 ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {calculated.warnings.length > 0 && (
            <div className="bg-caution-subtle border border-caution/20 rounded-lg px-3 py-2">
              {calculated.warnings.map((w, i) => (
                <p key={i} className="text-xs text-caution">{w}</p>
              ))}
            </div>
          )}

          <button
            onClick={() => {
              setCalories(String(calculated.calories))
              setProtein(String(calculated.protein_g))
              setCarbs(String(calculated.carbs_g))
              setFat(String(calculated.fat_g))
            }}
            className="text-xs text-brand hover:underline"
          >
            Use calculated values ↓
          </button>
          </CardContent>
        </Card>
      )}

      {/* Manual edit form */}
      <Card variant="action" className="gap-0 py-4">
        <CardContent>
      <form onSubmit={handleSave} className="space-y-4">
        <h3 className="text-sm font-medium text-ink">Override targets</h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Calories', value: calories, set: setCalories, unit: 'cal', min: '500', max: '10000' },
            { label: 'Protein', value: protein, set: setProtein, unit: 'g', min: '0', max: '500' },
            { label: 'Carbs', value: carbs, set: setCarbs, unit: 'g', min: '0', max: '1000' },
            { label: 'Fat (min)', value: fat, set: setFat, unit: 'g', min: '0', max: '500' },
          ].map(({ label, value, set, unit, min, max }) => (
            <div key={label} className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">{label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  min={min}
                  max={max}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-ink focus:outline-none focus:ring-2 focus:ring-ring text-sm pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Low-carb warning */}
        {parseInt(carbs) > 0 && parseInt(carbs) < 75 && (
          <div className="bg-caution-subtle border border-caution/20 rounded-lg px-3 py-2">
            <p className="text-xs text-caution">
              Carbs are below 75g/day. This may affect training energy and adherence. You can save
              these targets, but consider increasing carbs if performance suffers.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-ink">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for change..."
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>

        {saveError && (
          <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-sm text-success bg-success-subtle rounded-lg px-3 py-2">
            ✓ Targets updated and logged.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover min-h-11 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save targets'}
        </button>
      </form>
        </CardContent>
      </Card>

      {/* Phase 2Z trend summary + 28-day charts — values and math
          unchanged; now the trailing context section (4B.6C order). */}
      <NutritionTrendSection summary={trendSummary} />
    </div>
  )
}
