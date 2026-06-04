// ============================================================
// ShredOS — Fasting Utilities
// ============================================================
// duration_minutes is NOT stored in the database.
// All duration calculations happen here in the app.
// Fasting is treated as an adherence tool, not magic.
// ============================================================

import { differenceInMinutes, differenceInSeconds } from 'date-fns'
import type { FastingMilestone, FastingDurationResult, FastingWeekStats } from '@/types/app'
import type { FastingLog } from '@/types/database'

// ── Educational milestones ────────────────────────────────────────
// Non-prescriptive. The app explains what each duration means
// in practical terms without overstating fasting benefits.

export const FASTING_MILESTONES: FastingMilestone[] = [
  {
    hours: 12,
    label: 'Overnight fast',
    note: 'May support appetite control and meal structure. Calories still determine fat loss.',
    coachNote:
      'Your fast may help with meal structure today. Keep protein high — fasting does not compensate for low protein.',
  },
  {
    hours: 16,
    label: 'Common IF window',
    note:
      'Common intermittent fasting window. Useful if it helps calorie adherence. Not required for fat loss.',
    coachNote:
      'Your 16-hour fast helped you delay breakfast. Calories still determine fat loss — make sure protein stays on target today.',
  },
  {
    hours: 18,
    label: 'Extended IF',
    note: 'Longer fasting window. Watch training performance, hunger, and energy levels.',
    coachNote:
      'You fasted 18 hours. Watch your energy and workout performance. Prioritize a high-protein first meal to break the fast.',
  },
  {
    hours: 24,
    label: 'Full-day fast',
    note:
      'Extended fast. Use carefully and avoid if it causes binge eating, dizziness, poor workouts, or poor recovery.',
    coachNote:
      'A 24-hour fast may reduce calories today, but if your next-day hunger spikes or training suffers, it may not be worth it. Get back to your normal target tomorrow.',
  },
]

// ── Duration calculation ──────────────────────────────────────────

/**
 * Calculate fasting duration from started_at and ended_at (or now).
 * ended_at = null means the fast is still active.
 */
export function getFastingDuration(
  startedAt: string | Date,
  endedAt: string | Date | null
): { minutes: number; seconds: number } {
  const start = new Date(startedAt)
  const end = endedAt ? new Date(endedAt) : new Date()
  const totalSeconds = Math.max(0, differenceInSeconds(end, start))
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  }
}

/** Format duration in minutes to human-readable "Xh Ym" */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** Format duration with seconds for live timer display: "14:23:07" */
export function formatDurationHMS(minutes: number, seconds: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const s = seconds
  return [
    String(h).padStart(2, '0'),
    String(m).padStart(2, '0'),
    String(s).padStart(2, '0'),
  ].join(':')
}

/** Get the highest milestone reached for a given duration in hours */
export function getCurrentMilestone(durationHours: number): FastingMilestone | null {
  return (
    [...FASTING_MILESTONES].reverse().find((m) => durationHours >= m.hours) ?? null
  )
}

/** Get next upcoming milestone */
export function getNextMilestone(durationHours: number): FastingMilestone | null {
  return FASTING_MILESTONES.find((m) => durationHours < m.hours) ?? null
}

/** Full duration result with milestone */
export function getFastingDurationResult(
  startedAt: string | Date,
  endedAt: string | Date | null
): FastingDurationResult {
  const { minutes } = getFastingDuration(startedAt, endedAt)
  const hours = minutes / 60
  const milestone = getCurrentMilestone(hours)

  return {
    minutes,
    hours: Math.round(hours * 10) / 10,
    formatted: formatDuration(minutes),
    milestone,
  }
}

// ── completed_goal calculation ────────────────────────────────────

/**
 * Determines whether a fast completed its goal.
 * Called when ending a fast.
 */
export function didCompleteGoal(
  startedAt: string | Date,
  endedAt: string | Date,
  goalHours: number | null
): boolean {
  if (!goalHours) return true // no goal set = always complete
  const { minutes } = getFastingDuration(startedAt, endedAt)
  return minutes >= goalHours * 60
}

// ── Weekly stats ──────────────────────────────────────────────────

/** Compute weekly fasting stats from a list of completed fasts this week */
export function computeFastingWeekStats(fasts: FastingLog[]): FastingWeekStats {
  const completed = fasts.filter((f) => f.ended_at !== null)
  const completedGoal = fasts.filter((f) => f.completed_goal === true)

  if (completed.length === 0) {
    return {
      completedCount: 0,
      totalCount: fasts.length,
      avgDurationMinutes: null,
      avgDurationFormatted: null,
    }
  }

  const totalMinutes = completed.reduce((sum, f) => {
    const { minutes } = getFastingDuration(f.started_at, f.ended_at)
    return sum + minutes
  }, 0)

  const avg = Math.round(totalMinutes / completed.length)

  return {
    completedCount: completedGoal.length,
    totalCount: fasts.length,
    avgDurationMinutes: avg,
    avgDurationFormatted: formatDuration(avg),
  }
}

// ── Fasting type from goal hours ──────────────────────────────────

export function fastingTypeFromHours(hours: number): FastingLog['fasting_type'] {
  if (hours <= 12) return 'overnight'
  if (hours <= 20) return 'intermittent'
  if (hours <= 36) return 'extended'
  return 'custom'
}
