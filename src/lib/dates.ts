// ============================================================
// ShredOS — Date Utilities
// ============================================================

import { format, formatDistanceToNow, isToday, isYesterday, parseISO } from 'date-fns'

/** Format a date for display: "Friday, June 2" */
export function formatDateFull(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'EEEE, MMMM d')
}

/** Format a date for display: "Jun 2" */
export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d')
}

/** Format a date as ISO date: "2025-06-02" */
export function formatDateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Format a date relative to now, with friendly labels */
export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return formatDistanceToNow(d, { addSuffix: true })
}

/** Format a timestamp as time: "7:23 AM" */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'h:mm a')
}

/** Get name of a day from 0–6 (0=Sun) */
export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayIndex] ?? 'Friday'
}

/** Get short day name: "Fri" */
export function getDayNameShort(dayIndex: number): string {
  return getDayName(dayIndex).slice(0, 3)
}

/** Get today's date as an ISO date string */
export function todayISO(): string {
  return formatDateISO(new Date())
}

/** Get start of current week (Monday) as ISO date string */
export function startOfWeekISO(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day // Monday
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  monday.setHours(0, 0, 0, 0)
  return formatDateISO(monday)
}
