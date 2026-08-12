// ============================================================
// ForgeFitOS — Local-Time Utilities
// ============================================================
// Generic 12-hour <-> 24-hour segment conversion for the explicit
// segmented time controls (Phase 5A.2 QA correction, relocated here
// in Phase 5A.3 as a neutral shared module: workouts AND activity
// sessions consume it). Safari's segmented native time control can
// LOOK fully populated while one segment is still uncommitted,
// reporting an empty value — so manual forms use explicit Hour /
// Minute / AM-PM selects and these pure helpers convert between the
// segments and the local 24-hour 'HH:mm' contract that shared
// validation and the servers already use. No timezone logic here —
// composed strings stay LOCAL wall-clock values. Behavior is
// byte-equivalent to the original Phase 5A.2 implementation.

/** Compose explicit 12-hour segments into local 'HH:mm'.
 *  Returns null while any segment is missing or out of range — an
 *  incomplete control must never serialize into a misleading value. */
export function composeTime12To24(
  hour12: string,
  minute: string,
  meridiem: string
): string | null {
  if (!hour12 || !minute || !meridiem) return null
  const h = Number(hour12)
  const m = Number(minute)
  if (!Number.isInteger(h) || h < 1 || h > 12) return null
  if (!Number.isInteger(m) || m < 0 || m > 59) return null
  if (meridiem !== 'AM' && meridiem !== 'PM') return null
  // 12 AM -> 00, 12 PM -> 12, 1 PM -> 13, 11 PM -> 23
  let h24 = h % 12
  if (meridiem === 'PM') h24 += 12
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Split a local 24-hour 'HH:mm' into 12-hour segments for prefill. */
export function splitTime24To12(
  hhmm: string
): { hour12: string; minute: string; meridiem: 'AM' | 'PM' } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!match) return null
  const h = Number(match[1])
  if (h > 23 || Number(match[2]) > 59) return null
  const meridiem: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return { hour12: String(h12), minute: match[2], meridiem }
}
