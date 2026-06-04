'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Step1Bio } from './Step1Bio'
import { Step2Goals } from './Step2Goals'
import { Step3Schedule } from './Step3Schedule'
import { Step4Nutrition } from './Step4Nutrition'
import { feetInchesToCm, lbsToKg, parseFloat2, parseInt2 } from '@/lib/units'
import { calculateNutritionTargets } from '@/lib/nutrition'
import type { OnboardingFormState } from '@/types/app'

const INITIAL_STATE: OnboardingFormState = {
  display_name: '',
  age: '',
  sex: '',
  height_ft: '',
  height_in: '0',
  weight_lbs: '',
  goal_weight_lbs: '',
  bf_pct: '',
  goal_bf_pct: '',
  main_goal: 'fat_loss',
  training_experience: 'intermediate',
  activity_level: 'moderately_active',
  step_goal: '8000',
  preferred_weigh_in_cadence: 'weekly',
  preferred_weigh_in_day: '5', // Friday
  preferred_weigh_in_time: 'morning',
  fasting_enabled: false,
  default_fasting_goal_hours: '',
  fasting_notes: '',
  dietary_prefs: [],
  injuries: '',
  deficit_override: '',
}

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<OnboardingFormState>(INITIAL_STATE)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(patch: Partial<OnboardingFormState>) {
    setForm((prev) => ({ ...prev, ...patch }))
  }

  function next() {
    setStep((s) => Math.min(4, s + 1))
    window.scrollTo(0, 0)
  }

  function back() {
    setStep((s) => Math.max(1, s - 1))
    window.scrollTo(0, 0)
  }

  async function handleComplete(deficitOverride?: number) {
    setError(null)
    setSaving(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('Session expired. Please sign in again.')
      setSaving(false)
      router.push('/login')
      return
    }

    // Convert units: imperial → metric for storage
    const weightKg = form.weight_lbs ? lbsToKg(parseFloat(form.weight_lbs)) : null
    const goalWeightKg = form.goal_weight_lbs ? lbsToKg(parseFloat(form.goal_weight_lbs)) : null
    const heightCm =
      form.height_ft && !isNaN(parseInt(form.height_ft))
        ? feetInchesToCm(parseInt(form.height_ft), parseInt(form.height_in || '0'))
        : null

    const bfPct = parseFloat2(form.bf_pct)
    const weightLbs = parseFloat2(form.weight_lbs)

    // Calculate nutrition targets
    const nutrition = weightLbs
      ? calculateNutritionTargets({
          weightLbs,
          bfPct: bfPct ?? undefined,
          sex: form.sex || null,
          activityLevel: form.activity_level as 'sedentary' | 'moderately_active' | 'very_active',
          goal: form.main_goal as 'fat_loss' | 'muscle_gain' | 'strength' | 'recomposition' | 'maintenance' | 'running',
          deficitOverride,
        })
      : null

    try {
      // 1. Insert user_profiles
      const { error: profileError } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        display_name: form.display_name,
        age: parseInt2(form.age),
        sex: form.sex || null,
        height_cm: heightCm,
        current_weight_kg: weightKg,
        goal_weight_kg: goalWeightKg,
        bf_pct: bfPct,
        goal_bf_pct: parseFloat2(form.goal_bf_pct),
        training_experience: form.training_experience || null,
        main_goal: form.main_goal || null,
        activity_level: form.activity_level || null,
        step_goal: parseInt2(form.step_goal) ?? 8000,
        dietary_prefs: form.dietary_prefs,
        injuries: form.injuries || null,
        preferred_weigh_in_cadence: form.preferred_weigh_in_cadence,
        preferred_weigh_in_day: parseInt2(form.preferred_weigh_in_day) ?? 5,
        preferred_weigh_in_time: form.preferred_weigh_in_time,
        fasting_enabled: form.fasting_enabled,
        default_fasting_goal_hours: parseFloat2(form.default_fasting_goal_hours),
        fasting_notes: form.fasting_notes || null,
        onboarding_complete: true,
      }, { onConflict: 'user_id' })

      if (profileError) throw profileError

      // 2. Insert nutrition_targets (if weight was entered)
      if (nutrition) {
        const { error: nutritionError } = await supabase.from('nutrition_targets').upsert({
          user_id: user.id,
          effective_date: new Date().toISOString().split('T')[0],
          calories: nutrition.calories,
          protein_g: nutrition.protein_g,
          fat_g: nutrition.fat_g,
          carbs_g: nutrition.carbs_g,
          maintenance_cal: nutrition.maintenance_cal,
          deficit: nutrition.deficit,
          activity_level: form.activity_level || null,
          multiplier_used: nutrition.multiplier_used,
          protein_basis: nutrition.protein_basis,
          low_carb_warning: nutrition.low_carb_warning,
          notes: 'Set during onboarding',
        }, { onConflict: 'user_id,effective_date' })

        if (nutritionError) throw nutritionError
      }

      // 3. Create initial decision log entry
      await supabase.from('decision_logs').insert({
        user_id: user.id,
        decision_type: 'nutrition_targets_set',
        decision_title: 'Nutrition targets set from onboarding',
        decision_summary: nutrition
          ? `Calorie target: ${nutrition.calories} cal/day | Protein: ${nutrition.protein_g}g | Carbs: ${nutrition.carbs_g}g | Fat: ${nutrition.fat_g}g`
          : 'Profile created. Add your weight to generate nutrition targets.',
        reason: nutrition
          ? `Targets calculated using ${form.activity_level.replace('_', ' ')} multiplier (×${nutrition.multiplier_used}). ` +
            `Maintenance estimated at ${nutrition.maintenance_cal} cal. ` +
            `Deficit: ${nutrition.deficit} cal. ` +
            `Protein basis: ${nutrition.protein_basis}.` +
            (nutrition.warnings.length > 0 ? ` Warnings: ${nutrition.warnings.join(' ')}` : '')
          : 'Profile created during onboarding.',
        data_snapshot: {
          weight_lbs: form.weight_lbs,
          activity_level: form.activity_level,
          main_goal: form.main_goal,
          deficit: nutrition?.deficit,
        },
        previous_value: null,
        new_value: nutrition
          ? {
              calories: nutrition.calories,
              protein_g: nutrition.protein_g,
              carbs_g: nutrition.carbs_g,
              fat_g: nutrition.fat_g,
            }
          : null,
        status: 'applied',
        created_by: 'system',
        applied_at: new Date().toISOString(),
      })

      router.push('/dashboard')
    } catch (err) {
      console.error('Onboarding save error:', err)
      setError('Something went wrong saving your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const STEP_LABELS = ['Bio', 'Goals', 'Schedule', 'Nutrition']

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-xl font-bold">Set up your profile</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 4 — {STEP_LABELS[step - 1]}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-primary' : 'bg-secondary'
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="shred-card">
          {step === 1 && <Step1Bio form={form} update={update} onNext={next} />}
          {step === 2 && <Step2Goals form={form} update={update} onNext={next} onBack={back} />}
          {step === 3 && <Step3Schedule form={form} update={update} onNext={next} onBack={back} />}
          {step === 4 && (
            <Step4Nutrition
              form={form}
              update={update}
              onBack={back}
              onComplete={handleComplete}
              saving={saving}
            />
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
