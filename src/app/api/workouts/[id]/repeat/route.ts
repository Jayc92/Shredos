import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { localTodayFromCookies } from '@/lib/local-date-server'

// ============================================================
// ForgeFitOS — Repeat a completed workout (UI-5B2)
// POST with an EMPTY body -> repeat_workout RPC (migration 022).
// The RPC is the integrity authority: ownership, completed-only
// eligibility, three-step source locking, bounds, blank-value set
// skeletons with dense 1..N numbering, and the active-workout
// conflict (precheck + migration 008 unique index) all commit (or
// abort) in one transaction. The route accepts NO client data at
// all — no user id, no date, no performance values: the user comes
// solely from the authenticated session and the workout date is the
// USER-LOCAL calendar day resolved server-side via the shipped
// timezone-cookie contract. No service role exists in this app.
// ============================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function mapRpcError(message: string): { status: number; error: string } {
  if (message.includes('not_authenticated')) {
    return { status: 401, error: 'Unauthorized' }
  }
  // Not-owned and nonexistent sources are indistinguishable on
  // purpose — existence is never leaked.
  if (message.includes('not_found')) {
    return { status: 404, error: 'Not found' }
  }
  if (message.includes('invalid_input')) {
    return { status: 400, error: 'Invalid request.' }
  }
  return { status: 500, error: 'Could not repeat the workout.' }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  // No copied performance data, no client user id, no client date:
  // any non-empty body is rejected outright rather than silently
  // ignored.
  const rawBody = await request.text().catch(() => '')
  if (rawBody.trim() !== '' && rawBody.trim() !== '{}') {
    return NextResponse.json(
      { error: 'This endpoint accepts no request body.' },
      { status: 400 }
    )
  }

  // Local-date contract: the new workout lands on the USER'S
  // calendar day (timezone cookie), never the server's UTC day.
  const workoutDate = localTodayFromCookies()

  // The single RPC call — the route performs no other reads/writes.
  const { data, error } = await supabase.rpc('repeat_workout', {
    p_workout_session_id: params.id,
    p_workout_date: workoutDate,
  })
  if (error) {
    const mapped = mapRpcError(error.message ?? '')
    return NextResponse.json({ error: mapped.error }, { status: mapped.status })
  }

  // Expected business outcome returned as data by the RPC — the
  // same 409 shape the existing conflict modal flow consumes.
  if ((data as any)?.error === 'active_workout_exists') {
    return NextResponse.json(
      {
        error: 'A workout is already in progress.',
        active_workout_id: (data as any).active_workout_id ?? null,
      },
      { status: 409 }
    )
  }

  // Fail CLOSED: a success response must carry the created id.
  const sessionId = (data as any)?.session_id
  if (typeof sessionId !== 'string' || !UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'Could not repeat the workout.' }, { status: 500 })
  }

  return NextResponse.json({ data: { session_id: sessionId } }, { status: 201 })
}
