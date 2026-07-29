import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Marks a true active training session as skipped (Phase 2M) --
 * the dedicated replacement for the discard flow's previous
 * PATCH { status: 'skipped' } call, now that the generic PATCH route
 * is metadata-only.
 *
 * Only a genuine true active session (status='in_progress' AND
 * completed_duration_seconds IS NULL) may be skipped through this
 * route. This deliberately rejects: completed sessions, already-
 * skipped sessions, planned sessions (unused today, but not
 * something this route should legitimize), and correction sessions
 * (status='in_progress' with a non-null persisted duration) -- a
 * correction can never be discarded through this path.
 *
 * Not idempotent by design: repeating this call on an already-
 * skipped session returns the same 409 an illegal transition would,
 * rather than silently no-op succeeding.
 */
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: session, error: fetchError } = await supabase
    .from('workout_sessions')
    .select('status, completed_duration_seconds')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.status !== 'in_progress' || session.completed_duration_seconds !== null) {
    return NextResponse.json(
      { error: 'Only an active training session can be skipped.' },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .update({ status: 'skipped' })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
