import { cn } from '@/lib/utils'

// ============================================================
// ShredOS — weight_time set inputs (W10)
//
// The input group for a weighted hold: Added weight, Duration as the
// established minutes + seconds pair, and optional RPE. NO reps, NO
// distance. Pure and stateless — SetRow owns the state, the blur saves
// and the completion rule; this component only renders, so
// scripts/verify-weight-time-w10-ui.ts can render it to static markup
// and prove the accessible names, the visible zero, the per-side suffix
// and the read-only attributes without a browser.
//
// Copy (plan §4.1, O5): the field is "Added weight" — never "Weight",
// never "Bodyweight". A stored 0 arrives here as the string "0" and is
// rendered as the input's value; the "lbs" placeholder appears only
// when the value is genuinely missing.
// ============================================================

export interface WeightTimeSetInputsProps {
  /** Display value in lbs; '' when the stored weight is null, '0' when it is zero. */
  lbs: string
  durationMin: string
  durationSec: string
  rpe: string
  isUnilateral: boolean
  readOnly: boolean
  /** SetRow's shared input class, passed through so every mode's inputs match. */
  inputClassName: string
  onLbsChange: (value: string) => void
  onLbsBlur: () => void
  onDurationMinChange: (value: string) => void
  onDurationSecChange: (value: string) => void
  onDurationBlur: () => void
  onRpeChange: (value: string) => void
  onRpeBlur: () => void
}

export function WeightTimeSetInputs({
  lbs, durationMin, durationSec, rpe, isUnilateral, readOnly, inputClassName,
  onLbsChange, onLbsBlur, onDurationMinChange, onDurationSecChange, onDurationBlur, onRpeChange, onRpeBlur,
}: WeightTimeSetInputsProps) {
  // The existing unilateral semantics (SetRow's weightSuffix, plan §6):
  // the suffix reads "per side" for a unilateral exercise, "lbs" otherwise.
  const weightSuffix = isUnilateral ? 'per side' : 'lbs'

  return (
    <>
      {/* Added weight — external load; 0 is a real value and shows as 0 */}
      <div className="flex-1 min-w-0">
        <div className="relative">
          <input type="number" inputMode="decimal" value={lbs}
            onChange={e => onLbsChange(e.target.value)}
            onFocus={e => e.target.select()}
            onBlur={onLbsBlur}
            placeholder="lbs" min="0" step="0.5"
            aria-label={isUnilateral ? 'Added weight per side' : 'Added weight'}
            readOnly={readOnly}
            aria-readonly={readOnly}
            className={cn(inputClassName, isUnilateral ? 'pr-16' : 'pr-7')} />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-ink-muted select-none pointer-events-none whitespace-nowrap">
            {weightSuffix}
          </span>
        </div>
      </div>

      {/* Duration — the established minutes : seconds pair */}
      <div className="flex-1 min-w-0 flex items-center gap-1">
        <input type="number" inputMode="numeric" value={durationMin}
          onChange={e => onDurationMinChange(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={onDurationBlur}
          placeholder="min" min="0" step="1"
          aria-label="Duration — minutes"
          readOnly={readOnly}
          aria-readonly={readOnly}
          className={inputClassName} />
        <span className="text-xs text-ink-muted flex-shrink-0">:</span>
        <input type="number" inputMode="numeric" value={durationSec}
          onChange={e => onDurationSecChange(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={onDurationBlur}
          placeholder="sec" min="0" max="59" step="1"
          aria-label="Duration — seconds"
          readOnly={readOnly}
          aria-readonly={readOnly}
          className={inputClassName} />
      </div>

      {/* RPE — optional metadata for a hold; never a record or guidance input (D5) */}
      <div className="w-12 flex-shrink-0">
        <input type="number" inputMode="decimal" value={rpe}
          onChange={e => onRpeChange(e.target.value)}
          onFocus={e => e.target.select()}
          onBlur={onRpeBlur}
          placeholder="RPE" min="1" max="10" step="0.5"
          title="Rate of Perceived Exertion (1–10). Optional for a weighted hold; it never changes records or guidance."
          aria-label="RPE"
          readOnly={readOnly}
          aria-readonly={readOnly}
          className={inputClassName} />
      </div>
    </>
  )
}
