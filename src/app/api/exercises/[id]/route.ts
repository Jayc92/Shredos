import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  normalizeExercisePatchPayload, deriveLegacyExerciseType, validateMuscleTargets,
} from '@/lib/exercise-validation'
import type { MuscleGroup } from '@/lib/exercise-validation'
import { TRACKING_MODE_HISTORY_ERROR_TOKEN, TRACKING_MODE_HISTORY_409_COPY } from '@/lib/workout-set-contract'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const result = normalizeExercisePatchPayload(body)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  // Phase 2P: fetch the existing row first. This serves two purposes
  // in one query: (1) a deterministic 404 for a missing or another
  // user's exercise, instead of letting a zero-row update surface as
  // an unstructured error; (2) detecting a genuine true -> false
  // is_active transition below, rather than logging a deactivation
  // decision every time a request body merely CONTAINS is_active:false
  // (the prior behavior, which could create duplicate logs on repeated
  // PATCH calls).
  const { data: existing, error: fetchError } = await supabase
    .from('exercises')
    .select('is_active, primary_muscle, tracking_mode')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: 'Exercise not found.' }, { status: 404 })

  // W7 — friendly HISTORY PRECHECK (plan §5.3; UX only). Only when the
  // tracking_mode is ACTUALLY changing: if any CURRENT workout_sets row
  // references this exercise, answer 409 up front. The invariant is extant
  // rows, not "ever used": deleting the draft sets makes the change
  // legal again. The DATABASE is the integrity boundary — migration 028's
  // trigger rejects the same change atomically and independently of RLS —
  // and its error is mapped to the same 409 below in case a concurrent
  // append wins between this read and the update.
  const trackingModeChanging =
    result.value.tracking_mode !== undefined && result.value.tracking_mode !== existing.tracking_mode
  if (trackingModeChanging) {
    const { count: extantSetCount, error: extantSetError } = await supabase
      .from('workout_sets')
      .select('id, workout_exercises!inner ( exercise_id )', { count: 'exact', head: true })
      .eq('workout_exercises.exercise_id', params.id)
    if (extantSetError) return NextResponse.json({ error: 'Could not check the exercise history.' }, { status: 500 })
    if ((extantSetCount ?? 0) > 0) {
      return NextResponse.json({ error: TRACKING_MODE_HISTORY_409_COPY }, { status: 409 })
    }
  }

  // Phase 5A.6B: complete the primary-collision rule against the
  // EFFECTIVE primary. Pure validation could only see a primary sent
  // in the same payload; when muscle_targets arrive without one, the
  // stored primary is the authority a target must not duplicate.
  if (result.value.muscle_targets !== undefined && result.value.primary_muscle === undefined) {
    const revalidated = validateMuscleTargets(
      result.value.muscle_targets,
      existing.primary_muscle as MuscleGroup
    )
    if (!revalidated.ok) {
      return NextResponse.json({ error: revalidated.error }, { status: 400 })
    }
  }

  // Phase 5A.6B: muscle_targets never touch the exercise row (and the
  // deprecated secondary_muscles JSONB is never written — no
  // dual-write; exercise_muscles is authoritative).
  const { muscle_targets, ...patchFields } = result.value

  // Phase 2R: if this PATCH changes tracking_mode, refresh the legacy
  // exercise_type to match via the same derivation POST uses -- keeps
  // the legacy column consistent with the current tracking_mode
  // rather than freezing it at whatever value the exercise was
  // originally created with.
  const updatePayload: Record<string, unknown> = { ...patchFields }
  if (result.value.tracking_mode !== undefined) {
    updatePayload.exercise_type = deriveLegacyExerciseType(result.value.tracking_mode)
  }

  // A targets-only PATCH is legal: the relationship replacement below
  // is the whole edit, so skip the empty row update.
  let data: Record<string, unknown> | null = null
  if (Object.keys(updatePayload).length > 0) {
    const { data: updated, error } = await supabase
      .from('exercises').update(updatePayload)
      .eq('id', params.id).eq('user_id', user.id)
      .select().single()
    if (error) {
      if (error.code === '23505')
        return NextResponse.json({ error: 'You already have an exercise with this name.' }, { status: 409 })
      // W7 — RACE PATH: the precheck saw zero rows but a concurrent
      // append_workout_set committed first; the 028 guard rejected the
      // change. Controlled 409, never a generic 500.
      if ((error.message ?? '').includes(TRACKING_MODE_HISTORY_ERROR_TOKEN))
        return NextResponse.json({ error: TRACKING_MODE_HISTORY_409_COPY }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    data = updated
  } else {
    const { data: current, error } = await supabase
      .from('exercises').select('*')
      .eq('id', params.id).eq('user_id', user.id)
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    data = current
  }

  // Phase 5A.6B: authoritative relationship replacement — the payload
  // set fully replaces the exercise's secondary/tertiary rows via
  // safe delete+insert, scoped to THIS user's rows only (another
  // user's relationship rows are unreachable: every statement filters
  // user_id and RLS backstops it). Absent muscle_targets leaves the
  // relationships untouched.
  if (muscle_targets !== undefined) {
    const { error: clearError } = await supabase
      .from('exercise_muscles')
      .delete()
      .eq('exercise_id', params.id)
      .eq('user_id', user.id)
    if (clearError) return NextResponse.json({ error: clearError.message }, { status: 500 })
    if (muscle_targets.length > 0) {
      const { error: insertError } = await supabase
        .from('exercise_muscles')
        .insert(muscle_targets.map((t) => ({
          user_id: user.id,
          exercise_id: params.id,
          muscle: t.muscle,
          role: t.role,
        })))
      if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
  }

  // Decision log only on an actual true -> false transition (Phase 2P
  // correction) -- not merely because this request's payload happens
  // to include is_active: false, which would have logged again on
  // every repeated deactivation attempt against an already-inactive
  // exercise.
  if (existing.is_active === true && result.value.is_active === false && data) {
    // Count sessions in last 30 days that used this exercise
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { count } = await supabase
      .from('workout_exercises')
      .select('id', { count: 'exact', head: true })
      .eq('exercise_id', params.id)
    const sessionCount = count ?? 0
    if (sessionCount > 0) {
      await supabase.from('decision_logs').insert({
        user_id: user.id,
        decision_type: 'exercise_deactivated',
        decision_title: `${(data as any).name} deactivated`,
        decision_summary: `${(data as any).name} was used in ${sessionCount} session${sessionCount !== 1 ? 's' : ''}.`,
        reason: 'User manually deactivated the exercise from the library.',
        data_snapshot: { exercise_id: params.id, sessions_count: sessionCount },
        new_value: { is_active: false },
        status: 'applied', created_by: 'user',
        applied_at: new Date().toISOString(),
      })
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check for workout_exercises referencing this exercise
  const { count } = await supabase
    .from('workout_exercises').select('id', { count: 'exact', head: true })
    .eq('exercise_id', params.id)
  if (count && count > 0) {
    return NextResponse.json(
      { error: 'This exercise has workout history. Deactivate it instead of deleting.' },
      { status: 409 }
    )
  }

  const { error } = await supabase
    .from('exercises').delete()
    .eq('id', params.id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
