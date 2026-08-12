import { NextResponse } from 'next/server'
import { createClient, upsertActivityLogForDate } from '@/lib/supabase/server'
import { validateDailyMovementInput } from '@/lib/activity'
import { todayISO } from '@/lib/dates'

// ============================================================
// ForgeFitOS — passive daily aggregate movement (Phase 1H,
// extended in Phase 5A.4 with canonical daily distance).
//
// This route owns ALL daily_activity_logs writes. steps and
// distance are independently optional aggregate metrics:
// NULL = not recorded, 0 = explicitly zero. The old "blank
// becomes 0" coercion is gone — missing data must never be
// fabricated into a recorded zero (Phase 5A.4). Distance arrives
// as miles and is converted to canonical meters exactly once,
// server-side. Intentional activity_sessions never write here.
// ============================================================

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const today = todayISO()
  const date = typeof body.date === 'string' && body.date ? body.date : today

  // Future dates are blocked — movement can only be logged for today or the past
  if (date > today) {
    return NextResponse.json(
      { error: "Can't log steps for a future date." },
      { status: 400 }
    )
  }

  const validation = validateDailyMovementInput({
    steps: body.steps,
    distanceMiles: body.distanceMiles,
  })
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes : null

  try {
    const log = await upsertActivityLogForDate(
      supabase,
      user.id,
      date,
      validation.steps,
      validation.distanceMeters,
      notes
    )
    return NextResponse.json({ data: log })
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not save your daily movement. Try again.' },
      { status: 500 }
    )
  }
}
