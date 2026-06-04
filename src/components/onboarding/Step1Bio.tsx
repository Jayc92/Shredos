'use client'

import type { OnboardingFormState } from '@/types/app'

interface StepProps {
  form: OnboardingFormState
  update: (patch: Partial<OnboardingFormState>) => void
  onNext: () => void
  onBack?: () => void
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </label>
  )
}

function Field({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>
}

function Input({
  value,
  onChange,
  type = 'text',
  placeholder,
  min,
  max,
  step,
}: {
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  min?: string
  max?: string
  step?: string
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
    />
  )
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
    >
      {children}
    </select>
  )
}

function NextButton({
  onClick,
  disabled,
  label = 'Continue →',
}: {
  onClick: () => void
  disabled?: boolean
  label?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 rounded-lg border border-border text-muted-foreground font-medium text-sm hover:bg-secondary transition-colors"
    >
      ← Back
    </button>
  )
}

// ── Step 1 — Bio ─────────────────────────────────────────────────

export function Step1Bio({ form, update, onNext }: StepProps) {
  const canProceed = !!form.display_name.trim() && !!form.weight_lbs

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Tell us about yourself</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Basic info to personalize your plan.</p>
      </div>

      <Field>
        <Label required>Name</Label>
        <Input value={form.display_name} onChange={(v) => update({ display_name: v })} placeholder="Your name" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label>Age</Label>
          <Input value={form.age} onChange={(v) => update({ age: v })} type="number" placeholder="35" min="13" max="100" />
        </Field>
        <Field>
          <Label>Sex</Label>
          <Select value={form.sex} onChange={(v) => update({ sex: v })}>
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
          <div className="relative">
            <Input value={form.height_ft} onChange={(v) => update({ height_ft: v })} type="number" placeholder="6" min="3" max="8" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">ft</span>
          </div>
          <div className="relative">
            <Input value={form.height_in} onChange={(v) => update({ height_in: v })} type="number" placeholder="1" min="0" max="11" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">in</span>
          </div>
        </div>
      </Field>

      <Field>
        <Label required>Current weight</Label>
        <div className="relative">
          <Input value={form.weight_lbs} onChange={(v) => update({ weight_lbs: v })} type="number" placeholder="185" min="50" max="700" step="0.1" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">lbs</span>
        </div>
      </Field>

      <Field>
        <Label>Goal weight</Label>
        <div className="relative">
          <Input value={form.goal_weight_lbs} onChange={(v) => update({ goal_weight_lbs: v })} type="number" placeholder="165" min="50" max="700" step="0.1" />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">lbs</span>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field>
          <Label>Est. body fat %</Label>
          <div className="relative">
            <Input value={form.bf_pct} onChange={(v) => update({ bf_pct: v })} type="number" placeholder="22" min="1" max="60" step="0.1" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
          </div>
        </Field>
        <Field>
          <Label>Goal body fat %</Label>
          <div className="relative">
            <Input value={form.goal_bf_pct} onChange={(v) => update({ goal_bf_pct: v })} type="number" placeholder="15" min="1" max="60" step="0.1" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
          </div>
        </Field>
      </div>

      <NextButton onClick={onNext} disabled={!canProceed} />
    </div>
  )
}
