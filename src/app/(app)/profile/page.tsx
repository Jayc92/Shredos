'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  lbsToKg, kgToLbs, feetInchesToCm, cmToFeetInches, parseFloat2, parseInt2,
} from '@/lib/units'
import { WEIGH_IN_DAYS, FASTING_GOAL_OPTIONS, MAIN_GOAL_OPTIONS } from '@/lib/constants'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { OptionCard } from '@/components/ui/option-card'
import { Card, CardContent } from '@/components/ui/card'
import type { UserProfile } from '@/types/database'
// Client fetch state reuses the route's loading.tsx composition —
// identical skeleton for router navigation and client query, never a
// bare text fallback (4B.6C QA correction).
import ProfileLoading from './loading'

/** Inline numeric input with adjacent unit label */
function NumField({
  label, value, onChange, placeholder, min, max, step = 'any', unit,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  min?: string
  max?: string
  step?: string
  unit?: string
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-secondary border border-input text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-ring text-sm"
        />
        {unit && (
          <span className="text-sm text-ink-muted flex-shrink-0 w-8 text-center select-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [age, setAge] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('0')
  const [weightLbs, setWeightLbs] = useState('')
  const [goalWeightLbs, setGoalWeightLbs] = useState('')
  const [bfPct, setBfPct] = useState('')
  // Phase 3E QA fix: main_goal was previously only settable during
  // onboarding — invisible and unchangeable here even though it
  // drives the goal-adjustment review's eligibility.
  const [mainGoal, setMainGoal] = useState('')
  const [activityLevel, setActivityLevel] = useState('moderately_active')
  const [stepGoal, setStepGoal] = useState('8000')
  const [cadence, setCadence] = useState('weekly')
  const [weighInDay, setWeighInDay] = useState('5')
  const [weighInTime, setWeighInTime] = useState('morning')
  const [fastingEnabled, setFastingEnabled] = useState(false)
  const [fastingGoalHours, setFastingGoalHours] = useState('')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: p } = await supabase
        .from('user_profiles').select('*').eq('user_id', user.id).single()
      if (p) {
        setProfile(p)
        setDisplayName(p.display_name)
        setAge(p.age ? String(p.age) : '')
        if (p.height_cm) {
          const { feet, inches } = cmToFeetInches(p.height_cm)
          setHeightFt(String(feet)); setHeightIn(String(inches))
        }
        if (p.current_weight_kg) setWeightLbs(String(kgToLbs(p.current_weight_kg)))
        if (p.goal_weight_kg)    setGoalWeightLbs(String(kgToLbs(p.goal_weight_kg)))
        if (p.bf_pct)            setBfPct(String(p.bf_pct))
        setMainGoal(p.main_goal ?? '')
        setActivityLevel(p.activity_level ?? 'moderately_active')
        setStepGoal(String(p.step_goal))
        setCadence(p.preferred_weigh_in_cadence)
        setWeighInDay(String(p.preferred_weigh_in_day))
        setWeighInTime(p.preferred_weigh_in_time)
        setFastingEnabled(p.fasting_enabled)
        setFastingGoalHours(p.default_fasting_goal_hours ? String(p.default_fasting_goal_hours) : '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(false); setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const prevCadence    = profile?.preferred_weigh_in_cadence
    const prevStepGoal   = profile?.step_goal
    const prevFastGoal   = profile?.default_fasting_goal_hours
    const prevGoal       = profile?.main_goal ?? null
    const newStepGoal    = parseInt2(stepGoal) ?? 8000
    const newFastGoal    = parseFloat2(fastingGoalHours)
    // Explicit selection only — an untouched (never-set) goal stays
    // exactly as persisted; the database CHECK constraint rejects any
    // value outside the real enum server-side.
    const newGoal        = mainGoal || prevGoal

    const { error: upErr } = await supabase.from('user_profiles').update({
      display_name:                displayName,
      age:                         parseInt2(age),
      height_cm:                   heightFt && !isNaN(parseInt(heightFt))
                                     ? feetInchesToCm(parseInt(heightFt), parseInt(heightIn || '0'))
                                     : (profile?.height_cm ?? null),
      current_weight_kg:           weightLbs     ? lbsToKg(parseFloat(weightLbs))     : (profile?.current_weight_kg ?? null),
      goal_weight_kg:              goalWeightLbs ? lbsToKg(parseFloat(goalWeightLbs)) : (profile?.goal_weight_kg    ?? null),
      bf_pct:                      parseFloat2(bfPct),
      main_goal:                   newGoal,
      activity_level:              activityLevel,
      step_goal:                   newStepGoal,
      preferred_weigh_in_cadence:  cadence,
      preferred_weigh_in_day:      parseInt2(weighInDay) ?? 5,
      preferred_weigh_in_time:     weighInTime,
      fasting_enabled:             fastingEnabled,
      default_fasting_goal_hours:  newFastGoal,
    }).eq('user_id', user.id)

    if (upErr) { setError(upErr.message); setSaving(false); return }

    type Change = { type: string; title: string; summary: string; prev: unknown; next: unknown }
    const changes: Change[] = []
    if (prevCadence  !== cadence)      changes.push({ type: 'weigh_in_cadence_changed', title: `Weigh-in schedule changed to ${cadence}`, summary: `From ${prevCadence} to ${cadence}.`, prev: { cadence: prevCadence }, next: { cadence } })
    if (prevStepGoal !== newStepGoal)  changes.push({ type: 'step_goal_changed', title: `Step goal to ${newStepGoal.toLocaleString()}`, summary: `From ${prevStepGoal?.toLocaleString()} to ${newStepGoal.toLocaleString()}.`, prev: { step_goal: prevStepGoal }, next: { step_goal: newStepGoal } })
    if (prevFastGoal !== newFastGoal)  changes.push({ type: 'fasting_goal_changed', title: 'Fasting goal changed', summary: `From ${prevFastGoal ?? 'none'} to ${newFastGoal ?? 'none'} hrs.`, prev: { fasting_goal_hours: prevFastGoal }, next: { fasting_goal_hours: newFastGoal } })
    // Phase 3E QA fix: goal changes use the SAME existing profile
    // decision-logging pattern — never a calorie_adjustment, never a
    // target mutation.
    if (prevGoal !== newGoal && newGoal) {
      const goalLabel = (v: string | null) => MAIN_GOAL_OPTIONS.find((o) => o.value === v)?.label ?? 'not set'
      changes.push({ type: 'main_goal_changed', title: `Main goal changed to ${goalLabel(newGoal)}`, summary: `From ${goalLabel(prevGoal)} to ${goalLabel(newGoal)}.`, prev: { main_goal: prevGoal }, next: { main_goal: newGoal } })
    }

    for (const c of changes) {
      await supabase.from('decision_logs').insert({
        user_id: user.id, decision_type: c.type, decision_title: c.title,
        decision_summary: c.summary, reason: 'User updated profile.',
        previous_value: c.prev as Record<string,unknown>, new_value: c.next as Record<string,unknown>,
        status: 'applied', created_by: 'user', applied_at: new Date().toISOString(),
      })
    }
    setSaving(false); setSuccess(true); router.refresh()
  }

  if (loading) return <ProfileLoading />

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 lg:p-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Profile</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Biometrics and preferences. Changes save when you submit; schedule and
          goal changes are logged automatically, and changing your main goal never
          changes nutrition targets on its own.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Personal info */}
        <Card variant="default" className="gap-0 py-4">
          <CardContent className="space-y-4">
          <h3 className="text-sm font-semibold text-ink">Personal info</h3>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Name</label>
            <input
              type="text" value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onFocus={e => e.target.select()} required
              className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Age" value={age} onChange={setAge} placeholder="35" min="13" max="100" step="1" unit="yrs" />
            <NumField label="Body fat %" value={bfPct} onChange={setBfPct} placeholder="22" min="1" max="60" step="0.1" unit="%" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Height</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <input type="number" inputMode="numeric" value={heightFt} onChange={e => setHeightFt(e.target.value)} onFocus={e => e.target.select()} placeholder="6" min="3" max="8"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <span className="text-sm text-ink-muted select-none w-6 text-center">ft</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="number" inputMode="numeric" value={heightIn} onChange={e => setHeightIn(e.target.value)} onFocus={e => e.target.select()} placeholder="1" min="0" max="11"
                  className="flex-1 px-3 py-2.5 rounded-lg bg-secondary border border-input text-ink text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <span className="text-sm text-ink-muted select-none w-6 text-center">in</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField label="Current weight" value={weightLbs} onChange={setWeightLbs} placeholder="185" min="50" max="700" step="0.1" unit="lbs" />
            <NumField label="Goal weight"    value={goalWeightLbs} onChange={setGoalWeightLbs} placeholder="165" min="50" max="700" step="0.1" unit="lbs" />
          </div>
          </CardContent>
        </Card>

        {/* Main goal (Phase 3E QA fix — previously onboarding-only) */}
        <Card variant="elevated" className="gap-0 py-4">
          <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Main goal</h3>
          <p className="text-xs text-ink-muted">
            Drives goal-aware coaching and the target adjustment review. Changing it does
            not change your nutrition targets automatically — review them on the Nutrition
            page.
          </p>
          <div className="space-y-2">
            {MAIN_GOAL_OPTIONS.map(({ value, label, description }) => (
              <OptionCard
                key={value}
                selected={mainGoal === value}
                onClick={() => setMainGoal(value)}
                label={label}
                description={description}
              />
            ))}
          </div>
          {!mainGoal && (
            <p className="text-xs text-ink-muted">No goal set yet — choose one above.</p>
          )}
          </CardContent>
        </Card>

        {/* Activity level */}
        <Card variant="default" className="gap-0 py-4">
          <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Activity level</h3>
          <div className="space-y-2">
            <OptionCard selected={activityLevel === 'sedentary'}         onClick={() => setActivityLevel('sedentary')}         label="Sedentary"         description="Desk job, little exercise (x10)" />
            <OptionCard selected={activityLevel === 'moderately_active'} onClick={() => setActivityLevel('moderately_active')} label="Moderately active" description="3-4 workouts/week (x12)" />
            <OptionCard selected={activityLevel === 'very_active'}       onClick={() => setActivityLevel('very_active')}       label="Very active"       description="5+ workouts/week, active job (x14)" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Step goal: <span className="text-brand font-semibold">{parseInt(stepGoal).toLocaleString()}</span>
            </label>
            <input type="range" min="2000" max="20000" step="500" value={stepGoal}
              onChange={e => setStepGoal(e.target.value)} className="w-full accent-[hsl(var(--brand))]" />
          </div>
          </CardContent>
        </Card>

        {/* Weigh-in schedule */}
        <Card variant="default" className="gap-0 py-4">
          <CardContent className="space-y-3">
          <h3 className="text-sm font-semibold text-ink">Weigh-in schedule</h3>
          <p className="text-xs text-ink-muted">ForgeFitOS tracks your weight on your schedule. No daily pressure.</p>
          <div className="space-y-2">
            <OptionCard selected={cadence === 'weekly'}   onClick={() => setCadence('weekly')}   label="Once per week"        description="Recommended — consistent data without obsessing" />
            <OptionCard selected={cadence === 'biweekly'} onClick={() => setCadence('biweekly')} label="Once every two weeks" description="Less frequent — good for longer-term trends" />
            <OptionCard selected={cadence === 'manual'}   onClick={() => setCadence('manual')}   label="Manual — I decide"    description="No scheduled reminders" />
          </div>
          {cadence !== 'manual' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Day</label>
                <Select value={weighInDay} onValueChange={(v: string) => setWeighInDay(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {WEIGH_IN_DAYS.map(({ value, label }) => (
                      <SelectItem key={value} value={String(value)}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Time</label>
                <Select value={weighInTime} onValueChange={(v: string) => setWeighInTime(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          </CardContent>
        </Card>

        {/* Fasting */}
        <Card variant="subtle" className="gap-0 py-4">
          <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Fasting</h3>
            <button type="button" role="switch" aria-checked={fastingEnabled}
              onClick={() => setFastingEnabled(!fastingEnabled)}
              className={['relative w-11 h-6 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                fastingEnabled ? 'bg-brand' : 'bg-surface-sunken border border-edge'].join(' ')}>
              <span className={['absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                fastingEnabled ? 'translate-x-5' : 'translate-x-0'].join(' ')} />
            </button>
          </div>
          {fastingEnabled && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Default goal</label>
              <Select value={fastingGoalHours || 'none'} onValueChange={(v: string) => setFastingGoalHours(v === 'none' ? '' : v)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="No default" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No default</SelectItem>
                  {FASTING_GOAL_OPTIONS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          </CardContent>
        </Card>

        {error   && <p className="text-sm text-critical bg-critical-subtle rounded-lg px-3 py-2">{error}</p>}
        {success && <p className="text-sm text-success bg-success-subtle rounded-lg px-3 py-2">Profile saved. Changes logged.</p>}

        <button type="submit" disabled={saving}
          className="w-full py-3 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>
    </div>
  )
}
