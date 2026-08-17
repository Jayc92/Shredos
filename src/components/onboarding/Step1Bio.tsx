'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { OnboardingFormState } from '@/types/app'

interface StepProps {
  form: OnboardingFormState
  update: (patch: Partial<OnboardingFormState>) => void
  onNext: () => void
  onBack?: () => void
}

function Label({ children, required, htmlFor }: { children: React.ReactNode; required?: boolean; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-ink mb-1.5">
      {children}
      {required && <span className="text-critical ml-1">*</span>}
    </label>
  )
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>
}

// UI-7: semantic input tokens, 44px control height, associated ids,
// and a real suffix slot — the unit renders inside the control with
// reserved right padding, so it can never overlap typed values or
// Safari's number spinners.
function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  max,
  step,
  id,
  suffix,
  ariaLabel,
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  min?: string
  max?: string
  step?: string
  id?: string
  suffix?: string
  ariaLabel?: string
}) {
  const input = (
    <input
      id={id}
      aria-label={ariaLabel}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`w-full min-h-11 px-3 ${suffix ? 'pr-10' : ''} rounded-lg bg-surface-interactive border border-edge text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-focus-ring text-sm`}
    />
  )
  if (!suffix) return input
  return (
    <div className="relative">
      {input}
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-xs select-none pointer-events-none">
        {suffix}
      </span>
    </div>
  )
}

function Select({
  value,
  onChange,
  children,
  id,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
  id?: string
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full min-h-11 px-3 rounded-lg bg-surface-interactive border border-edge text-ink focus:outline-none focus:ring-2 focus:ring-focus-ring text-sm"
    >
      {children}
    </select>
  )
}

function NextButton({
  onClick,
  disabled,
  label = 'Continue',
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full min-h-11 py-3 rounded-lg bg-brand text-brand-foreground font-semibold text-sm hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-1.5"
    >
      {label}
      <ArrowRight className="w-4 h-4" aria-hidden="true" />
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full min-h-11 py-3 rounded-lg border border-edge text-ink-muted font-medium text-sm hover:bg-surface-sunken transition-colors inline-flex items-center justify-center gap-1.5"
    >
      <ArrowLeft className="w-4 h-4" aria-hidden="true" />
      Back
    </button>
  )
}

// ── Step 1 — Bio ─────────────────────────────────────────────────

export function Step1Bio({ form, update, onNext }: StepProps) {
  const canProceed = !!form.display_name.trim() && !!form.weight_lbs

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Tell us about yourself</h2>
        <p className="text-sm text-ink-muted mt-0.5">Basic info to personalize your plan.</p>
      </div>

      <Field>
        <Label required htmlFor="ob-name">Name</Label>
        <Input id="ob-name" value={form.display_name} onChange={(v) => update({ display_name: v })} placeholder="Your name" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label htmlFor="ob-age">Age</Label>
          <Input id="ob-age" value={form.age} onChange={(v) => update({ age: v })} type="number" placeholder="35" min="13" max="100" />
        </Field>
        <Field>
          <Label htmlFor="ob-sex">Sex</Label>
          <Select id="ob-sex" value={form.sex} onChange={(v) => update({ sex: v })}>
            <option value="">Prefer not to say</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
        </Field>
      </div>

      <Field>
        <Label>Height</Label>
        <div className="grid grid-cols-2 gap-2">
          <Input value={form.height_ft} onChange={(v) => update({ height_ft: v })} type="number" placeholder="6" min="3" max="8" suffix="ft" ariaLabel="Height feet" />
          <Input value={form.height_in} onChange={(v) => update({ height_in: v })} type="number" placeholder="1" min="0" max="11" suffix="in" ariaLabel="Height inches" />
        </div>
      </Field>

      <Field>
        <Label required htmlFor="ob-weight">Current weight</Label>
        <Input id="ob-weight" value={form.weight_lbs} onChange={(v) => update({ weight_lbs: v })} type="number" placeholder="185" min="50" max="700" step="0.1" suffix="lbs" />
      </Field>

      <Field>
        <Label htmlFor="ob-goal-weight">Goal weight <span className="text-ink-muted font-normal">(optional)</span></Label>
        <Input id="ob-goal-weight" value={form.goal_weight_lbs} onChange={(v) => update({ goal_weight_lbs: v })} type="number" placeholder="165" min="50" max="700" step="0.1" suffix="lbs" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label htmlFor="ob-bf">Est. body fat % <span className="text-ink-muted font-normal">(optional)</span></Label>
          <Input id="ob-bf" value={form.bf_pct} onChange={(v) => update({ bf_pct: v })} type="number" placeholder="22" min="1" max="60" step="0.1" suffix="%" />
        </Field>
        <Field>
          <Label htmlFor="ob-goal-bf">Goal body fat % <span className="text-ink-muted font-normal">(optional)</span></Label>
          <Input id="ob-goal-bf" value={form.goal_bf_pct} onChange={(v) => update({ goal_bf_pct: v })} type="number" placeholder="15" min="1" max="60" step="0.1" suffix="%" />
        </Field>
      </div>

      <NextButton onClick={onNext} disabled={!canProceed} />
    </div>
  )
}
