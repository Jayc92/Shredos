import { NextResponse } from 'next/server'
import { createClient, upsertActivityLogForDate } from '@/lib/supabase/server'
import { todayISO } from '@/lib/dates'

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

  // Future dates are blocked — steps can only be logged for today or the past
  if (date > today) {
    return NextResponse.json(
      { error: "Can't log steps for a future date." },
      { status: 400 }
    )
  }

  // Blank/invalid input treated as 0, never rejected
  let steps = Number(body.steps)
  if (!Number.isFinite(steps)) steps = 0
  steps = Math.max(0, Math.min(100000, Math.round(steps)))

  const notes = typeof body.notes === 'string' && body.notes.trim() !== '' ? body.notes : null

  try {
    const log = await upsertActivityLogForDate(supabase, user.id, date, steps, notes)
    return NextResponse.json({ data: log })
  } catch (err) {
    return NextResponse.json(
      { error: 'Could not save steps. Try again.' },
      { status: 500 }
    )
  }
}
