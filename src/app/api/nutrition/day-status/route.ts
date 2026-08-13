import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { todayISO } from '@/lib/dates'

// ============================================================
// ForgeFitOS — explicit nutrition-day completion (Phase 5B.2)
//
// The write surface for nutrition_day_status (migration 019). One
// row means "the user explicitly marked this day's logging
// complete"; DELETE removes that declaration (undo — absence means
// unknown, never explicitly incomplete). Historical local dates are
// fully supported; future dates are blocked (a day that hasn't
// happened can't be finished). Editing food after marking complete
// deliberately does NOT clear the row — completion means "I
// consider this day finished" and only the user undoes it; the
// energy facts always recompute actual current intake from
// food_logs (no snapshotting).
// ============================================================

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function validDateParam(raw: string | null): string | null {
  if (!raw || !DATE_PATTERN.test(raw)) return null
  // Local-calendar semantics: lexical compare against the server's
  // local today, same convention as /api/activity.
  if (raw > todayISO()) return null
  return raw
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = request.nextUrl.searchParams.get('date')
  if (!raw || !DATE_PATTERN.test(raw)) {
    return NextResponse.json({ error: 'Enter a valid date.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('nutrition_day_status')
    .select('logged_date, status')
    .eq('user_id', user.id)
    .eq('logged_date', raw)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Absence of a row reads as complete: false — unknown, never
  // "explicitly incomplete".
  return NextResponse.json({ data: { date: raw, complete: data !== null } })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const date = validDateParam(typeof body.date === 'string' ? body.date : null)
  if (!date) {
    return NextResponse.json(
      { error: "Enter a valid date that isn't in the future." },
      { status: 400 }
    )
  }

  // Idempotent: marking an already-complete day stays complete
  // (unique user+date row, upserted).
  const { data, error } = await supabase
    .from('nutrition_day_status')
    .upsert(
      {
        user_id: user.id,
        logged_date: date,
        status: 'complete',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,logged_date' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const raw = request.nextUrl.searchParams.get('date')
  if (!raw || !DATE_PATTERN.test(raw)) {
    return NextResponse.json({ error: 'Enter a valid date.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('nutrition_day_status')
    .delete()
    .eq('user_id', user.id)
    .eq('logged_date', raw)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
