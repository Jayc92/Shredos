import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { blockIfSessionCompleted } from '@/lib/supabase/workout-guards'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('*, workout_exercises(*, exercise:exercises(*), workout_sets(*))')
    .eq('id', params.id).eq('user_id', user.id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ data })
}

// Phase 2N: server-side length limits for the two metadata fields this
// route accepts. Enforced here (not just via HTML maxlength) since the
// client can't be trusted as the sole source of truth.
const WORKOUT_TITLE_MAX_LENGTH = 100
const WORKOUT_NOTES_MAX_LENGTH = 2000

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Phase 2I: a completed workout is read-only, including this generic
  // PATCH — it must not be usable to bypass the dedicated reopen route
  // (e.g. a PATCH body containing status: 'in_progress'). The ONLY
  // legal completed -> in_progress transition is POST
  // /api/workouts/[id]/reopen.
  const locked = await blockIfSessionCompleted(supabase, params.id, user.id)
  if (locked) return locked

  const body = await request.json().catch(() => ({}))

  // Phase 2M: this route is metadata-only. Lifecycle fields (status,
  // start_time, end_time, completed_duration_seconds) and identity/
  // ownership fields (id, user_id, routine_id, created_at, updated_at,
  // workout_date) are owned by their own dedicated transitions
  // (complete/reopen/skip routes) or are not editable at all. Any
  // unsupported field is rejected explicitly rather than silently
  // ignored, so a caller never gets the false impression that a field
  // it sent was accepted.
  const ALLOWED_FIELDS = new Set(['title', 'notes'])
  const unsupported = Object.keys(body).filter((key) => !ALLOWED_FIELDS.has(key))
  if (unsupported.length > 0) {
    return NextResponse.json(
      { error: 'Only title and notes can be updated through this endpoint.' },
      { status: 400 }
    )
  }

  const update: { title?: string | null; notes?: string | null } = {}

  // Title: whitespace-only trims down to an empty string (not null) --
  // an intentionally blank title is different from "no title set",
  // and session.title || 'Workout' already displays a sensible
  // fallback for an empty string exactly as it does for null.
  if ('title' in body) {
    if (typeof body.title === 'string') {
      const trimmed = body.title.trim()
      if (trimmed.length > WORKOUT_TITLE_MAX_LENGTH) {
        return NextResponse.json(
          { error: `Workout title must be ${WORKOUT_TITLE_MAX_LENGTH} characters or fewer.` },
          { status: 400 }
        )
      }
      update.title = trimmed
    } else if (body.title === null) {
      update.title = null
    } else {
      update.title = undefined
    }
  }

  // Notes: whitespace-only becomes null (a note that's just spaces is
  // functionally "no note"), unlike title's empty-string behavior --
  // internal line breaks are preserved, only outer whitespace is trimmed.
  if ('notes' in body) {
    if (typeof body.notes === 'string') {
      const trimmed = body.notes.trim()
      if (trimmed.length > WORKOUT_NOTES_MAX_LENGTH) {
        return NextResponse.json(
          { error: `Workout notes must be ${WORKOUT_NOTES_MAX_LENGTH} characters or fewer.` },
          { status: 400 }
        )
      }
      update.notes = trimmed.length > 0 ? trimmed : null
    } else if (body.notes === null) {
      update.notes = null
    } else {
      update.notes = undefined
    }
  }

  // Strip any key that resolved to undefined (a wrong-typed value for
  // an otherwise-allowed field) rather than sending it to Supabase.
  for (const key of Object.keys(update) as Array<keyof typeof update>) {
    if (update[key] === undefined) delete update[key]
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('workout_sessions')
    .update(update)
    .eq('id', params.id).eq('user_id', user.id)
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { error } = await supabase
    .from('workout_sessions')
    .delete()
    .eq('id', params.id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
