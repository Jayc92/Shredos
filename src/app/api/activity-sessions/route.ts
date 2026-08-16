import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { TIMEZONE_COOKIE, todayInTimeZone } from '@/lib/local-date'
import { validateActivitySessionInput } from '@/lib/activity'

// ============================================================
// ForgeFitOS — Intentional activity sessions (Phase 5A.3)
//
// Server-authoritative writes (approved architectural change: NOT
// the fasting direct-write pattern). The server enforces the type
// vocabulary, local-date/start-time semantics, duration and
// distance/calorie contracts, and — critically — provenance: every
// created row is source='manual'; the client can never choose it.
//
// This domain is deliberately separate from /api/activity, which
// continues to mean PASSIVE daily steps. Sessions never write steps,
// daily aggregates, or anything nutrition-related.
// ============================================================

// The date-only future rule compares LOCAL calendar dates. The
// timezone cookie (LocalDateSync) now tells the server the user's
// real calendar day, so the guard is exact whenever it is present;
// the pre-cookie fallback keeps the documented one-day-of-skew
// tolerance so a legitimate "today" entered west of UTC is never
// rejected on a cookie-less first request. The client still
// validates strictly against the user's real local today.
function serverTodayWithSkew(): string {
  const tz = cookies().get(TIMEZONE_COOKIE)?.value
  if (tz) return todayInTimeZone(tz)
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().split('T')[0]
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const validation = validateActivitySessionInput(
    {
      activityType: body.activityType,
      activityDate: body.activityDate,
      startTime: body.startTime,
      durationMinutes: body.durationMinutes,
      distanceMiles: body.distanceMiles,
      caloriesBurned: body.caloriesBurned,
      notes: body.notes,
    },
    serverTodayWithSkew()
  )
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  const { activityType, activityDate, startedAt, durationSeconds,
    distanceMeters, caloriesBurned, notes } = validation

  // Every persisted field is server-derived. source is supplied HERE
  // and only here — the payload cannot influence it (or id/user_id).
  const { data, error } = await supabase
    .from('activity_sessions')
    .insert({
      user_id: user.id,
      activity_type: activityType,
      activity_date: activityDate,
      started_at: startedAt?.toISOString() ?? null,
      duration_seconds: durationSeconds,
      distance_meters: distanceMeters,
      calories_burned: caloriesBurned,
      source: 'manual',
      notes,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
