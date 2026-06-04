'use client'

import { OptionCard, OptionCardCompact } from '@/components/ui/option-card'
import type { OnboardingFormState } from '@/types/app'

interface Step2Props {
  form: OnboardingFormState
  update: (patch: Partial<OnboardingFormState>) => void
  onNext: () => void
  onBack: () => void
}

export function Step2Goals({ form, update, onNext, onBack }: Step2Props) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Goals &amp; experience</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Used to calibrate your plan and targets.
        </p>
      </div>

      {/* Main goal */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Main goal</p>
        <div className="space-y-2">
          {([
            { value: 'fat_loss',      label: 'Fat loss',         description: 'Lose fat while preserving muscle' },
            { value: 'muscle_gain',   label: 'Muscle gain',      description: 'Build muscle in a calorie surplus' },
            { value: 'recomposition', label: 'Recomposition',    description: 'Lose fat and gain muscle simultaneously' },
            { value: 'maintenance',   label: 'Maintenance',      description: 'Hold current weight and improve fitness' },
            { value: 'strength',      label: 'Strength',         description: 'Focus on getting stronger' },
            { value: 'running',       label: 'Running / cardio', description: 'Improve endurance and pace' },
          ] as const).map(({ value, label, description }) => (
            <OptionCard
              key={value}
              selected={form.main_goal === value}
              onClick={() => update({ main_goal: value })}
              label={label}
              description={description}
            />
          ))}
        </div>
      </div>

      {/* Training experience — compact 3-col */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Training experience</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: 'beginner',     label: 'Beginner',     description: '< 1 year' },
            { value: 'intermediate', label: 'Intermediate', description: '1–3 years' },
            { value: 'advanced',     label: 'Advanced',     description: '3+ years' },
          ] as const).map(({ value, label, description }) => (
            <OptionCardCompact
              key={value}
              selected={form.training_experience === value}
              onClick={() => update({ training_experience: value })}
              label={label}
              description={description}
            />
          ))}
        </div>
      </div>

      {/* Activity level */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Activity level</p>
        <div className="space-y-2">
          {([
            { value: 'sedentary',         label: 'Sedentary',         description: 'Desk job, little exercise (x10)' },
            { value: 'moderately_active', label: 'Moderately active', description: '3-4 workouts/week (x12)' },
            { value: 'very_active',       label: 'Very active',       description: '5+ workouts/week, active job (x14)' },
          ] as const).map(({ value, label, description }) => (
            <OptionCard
              key={value}
              selected={form.activity_level === value}
              onClick={() => update({ activity_level: value })}
              label={label}
              description={description}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          Multiplier used for your maintenance calorie estimate. Adjustable on the next step.
        </p>
      </div>

      {/* Step goal slider */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Daily step goal:{' '}
          <span className="text-primary font-semibold">
            {parseInt(form.step_goal || '8000').toLocaleString()}
          </span>
        </label>
        <input
          type="range"
          min="2000"
          max="20000"
          step="500"
          value={form.step_goal}
          onChange={(e) => update({ step_goal: e.target.value })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>2,000</span>
          <span>10,000</span>
          <span>20,000</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="py-3 rounded-lg border border-border text-muted-foreground font-medium text-sm hover:bg-muted transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
