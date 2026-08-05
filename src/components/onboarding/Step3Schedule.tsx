'use client'

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { OptionCard, OptionPill } from '@/components/ui/option-card'
import { WEIGH_IN_DAYS, FASTING_GOAL_OPTIONS, DIETARY_PREF_OPTIONS } from '@/lib/constants'
import type { OnboardingFormState } from '@/types/app'

interface Step3Props {
  form: OnboardingFormState
  update: (patch: Partial<OnboardingFormState>) => void
  onNext: () => void
  onBack: () => void
}

export function Step3Schedule({ form, update, onNext, onBack }: Step3Props) {
  function toggleDietaryPref(pref: string) {
    const next = form.dietary_prefs.includes(pref)
      ? form.dietary_prefs.filter((p) => p !== pref)
      : [...form.dietary_prefs, pref]
    update({ dietary_prefs: next })
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold">Schedule &amp; preferences</h2>
        <p className="text-sm text-muted-foreground mt-0.5">ForgeFitOS works on your schedule.</p>
      </div>

      <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed">
          ForgeFitOS tracks your weight on your schedule. Most users weigh in once a week on Friday
          morning. You can change this anytime.{' '}
          <strong className="text-primary">No daily pressure.</strong>
        </p>
      </div>

      {/* Weigh-in cadence */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Weigh-in schedule</p>
        <div className="space-y-2">
          <OptionCard
            selected={form.preferred_weigh_in_cadence === 'weekly'}
            onClick={() => update({ preferred_weigh_in_cadence: 'weekly' })}
            label="Once per week"
            description="Recommended — consistent data without obsessing"
          />
          <OptionCard
            selected={form.preferred_weigh_in_cadence === 'biweekly'}
            onClick={() => update({ preferred_weigh_in_cadence: 'biweekly' })}
            label="Once every two weeks"
            description="Less frequent — works well for long-term trends"
          />
          <OptionCard
            selected={form.preferred_weigh_in_cadence === 'manual'}
            onClick={() => update({ preferred_weigh_in_cadence: 'manual' })}
            label="Manual"
            description="No scheduled reminders — log whenever you choose"
          />
        </div>
      </div>

      {/* Day + time */}
      {form.preferred_weigh_in_cadence !== 'manual' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Preferred day</label>
            <Select
              value={form.preferred_weigh_in_day}
              onValueChange={(v: string) => update({ preferred_weigh_in_day: v })}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WEIGH_IN_DAYS.map(({ value, label }) => (
                  <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Time of day</label>
            <Select
              value={form.preferred_weigh_in_time}
              onValueChange={(v: string) => update({ preferred_weigh_in_time: v })}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning (recommended)</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Fasting */}
      <div className="pt-2 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Enable fasting tracking</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Log fasts as a calorie adherence tool.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.fasting_enabled}
            onClick={() => update({ fasting_enabled: !form.fasting_enabled })}
            className={[
              'relative w-11 h-6 rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              form.fasting_enabled ? 'bg-primary' : 'bg-secondary border border-border',
            ].join(' ')}
          >
            <span className={[
              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
              form.fasting_enabled ? 'translate-x-5' : 'translate-x-0',
            ].join(' ')} />
          </button>
        </div>

        {form.fasting_enabled && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Default fasting goal</label>
            <Select
              value={form.default_fasting_goal_hours || 'none'}
              onValueChange={(v: string) =>
                update({ default_fasting_goal_hours: v === 'none' ? '' : v })
              }
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="No default goal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No default goal</SelectItem>
                {FASTING_GOAL_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Dietary prefs */}
      <div className="pt-2 border-t border-border">
        <label className="block text-sm font-medium text-foreground mb-2">
          Dietary preferences <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {DIETARY_PREF_OPTIONS.map((pref) => (
            <OptionPill
              key={pref}
              selected={form.dietary_prefs.includes(pref)}
              onClick={() => toggleDietaryPref(pref)}
            >
              {pref}
            </OptionPill>
          ))}
        </div>
      </div>

      {/* Injuries */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Injuries / limitations <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={form.injuries}
          onChange={(e) => update({ injuries: e.target.value })}
          placeholder="e.g. bad left knee, lower back pain"
          rows={2}
          className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <button type="button" onClick={onBack}
          className="py-3 rounded-lg border border-border text-muted-foreground font-medium text-sm hover:bg-muted transition-colors">
          Back
        </button>
        <button type="button" onClick={onNext}
          className="py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">
          Review targets
        </button>
      </div>
    </div>
  )
}
