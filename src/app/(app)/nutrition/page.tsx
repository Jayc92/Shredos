'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateNutritionTargets } from '@/lib/nutrition'
import {
  buildNutritionTrendSummary,
  fetchNutritionTrendLogs,
} from '@/lib/nutrition-trends'
import type { RawFoodLogLike } from '@/lib/nutrition-trends'
import { NutritionTrendSection } from '@/components/nutrition/NutritionTrendSection'
import { kgToLbs } from '@/lib/units'
import type { NutritionTarget, UserProfile } from '@/types/database'

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
          .lte('effective_date', new Date().toISOString().split('T')[0])
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

    const today = new Date().toISOString().split('T')[0]
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
    return (
      <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
    )
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
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-xl font-bold">Nutrition targets</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Edit your daily targets. Each change is versioned and logged.
        </p>
      </div>

      {/* Phase 2Z: nutrition trend summary + 28-day charts, ahead of
          the existing targets content, which is preserved unchanged. */}
      <NutritionTrendSection summary={trendSummary} />

      {/* Calculated suggestion */}
      {calculated && (
        <div className="shred-card space-y-3">
          <h3 className="text-sm font-medium text-foreground">
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
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {calculated.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-300">⚠️ {w}</p>
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
            className="text-xs text-primary hover:underline"
          >
            Use calculated values ↓
          </button>
        </div>
      )}

      {/* Manual edit form */}
      <form onSubmit={handleSave} className="shred-card space-y-4">
        <h3 className="text-sm font-medium text-foreground">Override targets</h3>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Calories', value: calories, set: setCalories, unit: 'cal', min: '500', max: '10000' },
            { label: 'Protein', value: protein, set: setProtein, unit: 'g', min: '0', max: '500' },
            { label: 'Carbs', value: carbs, set: setCarbs, unit: 'g', min: '0', max: '1000' },
            { label: 'Fat (min)', value: fat, set: setFat, unit: 'g', min: '0', max: '500' },
          ].map(({ label, value, set, unit, min, max }) => (
            <div key={label} className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground">{label}</label>
              <div className="relative">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  min={min}
                  max={max}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm pr-10"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Low-carb warning */}
        {parseInt(carbs) > 0 && parseInt(carbs) < 75 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-300">
              ⚠️ Carbs are below 75g/day. This may affect training energy and adherence. You can save
              these targets, but consider increasing carbs if performance suffers.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Reason for change..."
            className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
        </div>

        {saveError && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">{saveError}</p>
        )}
        {saveSuccess && (
          <p className="text-sm text-green-400 bg-green-400/10 rounded-lg px-3 py-2">
            ✓ Targets updated and logged.
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saving ? 'Saving...' : 'Save targets'}
        </button>
      </form>
    </div>
  )
}
